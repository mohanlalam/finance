/**
 * documentCrypto.ts — Zero-Trust Client-Side Document Encryption (AES-GCM-256)
 *
 * Implements client-side envelope encryption for family documents using the native W3C Web Crypto API.
 * Files are encrypted on the client device BEFORE transmission to Supabase Storage.
 * Supabase and network intermediaries store only opaque ciphertext.
 *
 * Binary Envelope Layout (AGYENC01):
 * [0..5]   : Magic Header ASCII 'AGYENC' (6 bytes)
 * [6]      : Format Version 0x01 (1 byte)
 * [7..8]   : Metadata Length N (2 bytes Uint16 BE)
 * [9..9+N] : Metadata JSON UTF-8 string (MIME type, original name, size, timestamp)
 * [+16]    : Cryptographic Salt (16 bytes)
 * [+12]    : Initialization Vector (12 bytes)
 * [Rest]   : AES-GCM Ciphertext + 16-byte Authentication Tag
 */

import { logger } from '../infrastructure/logging/logger';

export const MAGIC_HEADER = new Uint8Array([0x41, 0x47, 0x59, 0x45, 0x4e, 0x43]); // 'AGYENC'
export const FORMAT_VERSION = 1;
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

export interface EncryptedDocumentMetadata {
  fileName: string;
  mimeType: string;
  originalSize: number;
  encryptedAt: string;
}

export interface DecryptedDocumentResult {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

/** Check if Web Crypto Subtle is available in current environment */
export function isDocumentCryptoSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.importKey === 'function' &&
    typeof crypto.subtle.deriveKey === 'function' &&
    typeof crypto.subtle.encrypt === 'function' &&
    typeof crypto.subtle.decrypt === 'function'
  );
}

/** Inspects the first 6 bytes of a buffer to check for the AGYENC signature */
export function isDocumentEncrypted(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 7) return false;
  const view = new Uint8Array(buffer, 0, 6);
  for (let i = 0; i < 6; i++) {
    if (view[i] !== MAGIC_HEADER[i]) return false;
  }
  return true;
}

/**
 * Derives an AES-GCM-256 key from the user's PIN hash and a unique 16-byte salt
 * using PBKDF2 with 100,000 iterations of SHA-256.
 */
export async function deriveEncryptionKey(
  pinHash: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pinHash),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    rawKeyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a File or Blob client-side using AES-GCM-256.
 * Returns an opaque binary envelope Blob ready for zero-knowledge cloud upload.
 */
export async function encryptDocumentFile(
  file: File | Blob,
  pinHash: string,
  customFileName?: string
): Promise<Blob> {
  if (!isDocumentCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }
  if (!pinHash) {
    throw new Error('Valid session PIN hash is required for document encryption.');
  }

  const fileName =
    customFileName ||
    (file instanceof File ? file.name : 'document.bin');
  const mimeType = file.type || 'application/octet-stream';
  const fileBytes = await file.arrayBuffer();

  // 1. Generate random 16-byte salt and 12-byte IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  // 2. Derive AES-GCM-256 key
  const key = await deriveEncryptionKey(pinHash, salt);

  // 3. Encrypt file payload
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileBytes
  );

  // 4. Construct metadata
  const metadata: EncryptedDocumentMetadata = {
    fileName,
    mimeType,
    originalSize: fileBytes.byteLength,
    encryptedAt: new Date().toISOString(),
  };

  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const metadataLen = metadataBytes.byteLength;

  if (metadataLen > 65535) {
    throw new Error('Metadata exceeds maximum header size limit.');
  }

  // 5. Build envelope buffer
  // Header: 6 (magic) + 1 (version) + 2 (meta len) + meta len + 16 (salt) + 12 (iv) + ciphertext
  const totalHeaderSize = 6 + 1 + 2 + metadataLen + SALT_BYTE_LENGTH + IV_BYTE_LENGTH;
  const envelopeBuffer = new Uint8Array(totalHeaderSize + ciphertextBuffer.byteLength);

  let offset = 0;
  // Magic bytes
  envelopeBuffer.set(MAGIC_HEADER, offset);
  offset += 6;

  // Version
  envelopeBuffer[offset] = FORMAT_VERSION;
  offset += 1;

  // Metadata length (Uint16 Big Endian)
  envelopeBuffer[offset] = (metadataLen >> 8) & 0xff;
  envelopeBuffer[offset + 1] = metadataLen & 0xff;
  offset += 2;

  // Metadata payload
  envelopeBuffer.set(metadataBytes, offset);
  offset += metadataLen;

  // Salt
  envelopeBuffer.set(salt, offset);
  offset += SALT_BYTE_LENGTH;

  // IV
  envelopeBuffer.set(iv, offset);
  offset += IV_BYTE_LENGTH;

  // Ciphertext + GCM auth tag
  envelopeBuffer.set(new Uint8Array(ciphertextBuffer), offset);

  logger.info('Document encrypted successfully client-side (AES-GCM-256)', {
    fileName,
    originalSize: fileBytes.byteLength,
    envelopeSize: envelopeBuffer.byteLength,
  });

  return new Blob([envelopeBuffer], { type: 'application/octet-stream' });
}

/**
 * Decrypts a document envelope.
 * If the document is NOT encrypted (legacy file without AGYENC header), it returns the original file untouched.
 */
export async function decryptDocumentBlob(
  data: Blob | ArrayBuffer,
  pinHash: string
): Promise<DecryptedDocumentResult> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;

  // Backward-compatibility check: if unencrypted legacy file, return as-is
  if (!isDocumentEncrypted(buffer)) {
    const mimeType = data instanceof Blob ? data.type || 'application/octet-stream' : 'application/octet-stream';
    return {
      blob: data instanceof Blob ? data : new Blob([buffer], { type: mimeType }),
      fileName: 'document',
      mimeType,
    };
  }

  if (!isDocumentCryptoSupported()) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }
  if (!pinHash) {
    throw new Error('Valid session PIN hash is required to decrypt this confidential document.');
  }

  const view = new Uint8Array(buffer);
  let offset = 6; // skip magic

  const version = view[offset];
  offset += 1;

  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported document encryption format version: ${version}`);
  }

  // Metadata length (Uint16 Big Endian)
  const metadataLen = (view[offset] << 8) | view[offset + 1];
  offset += 2;

  if (offset + metadataLen + SALT_BYTE_LENGTH + IV_BYTE_LENGTH > view.byteLength) {
    throw new Error('Corrupted document envelope header: buffer truncated.');
  }

  // Metadata
  const metadataBytes = view.slice(offset, offset + metadataLen);
  offset += metadataLen;

  let metadata: EncryptedDocumentMetadata;
  try {
    const metadataStr = new TextDecoder().decode(metadataBytes);
    metadata = JSON.parse(metadataStr) as EncryptedDocumentMetadata;
  } catch (err) {
    throw new Error(`Failed to parse encrypted document metadata: ${String(err)}`);
  }

  // Salt
  const salt = view.slice(offset, offset + SALT_BYTE_LENGTH);
  offset += SALT_BYTE_LENGTH;

  // IV
  const iv = view.slice(offset, offset + IV_BYTE_LENGTH);
  offset += IV_BYTE_LENGTH;

  // Ciphertext
  const ciphertext = view.slice(offset);

  // Derive key & decrypt
  const key = await deriveEncryptionKey(pinHash, salt);

  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const decryptedBlob = new Blob([plaintextBuffer], {
      type: metadata.mimeType || 'application/octet-stream',
    });

    logger.info('Document decrypted successfully client-side (AES-GCM-256)', {
      fileName: metadata.fileName,
      size: plaintextBuffer.byteLength,
    });

    return {
      blob: decryptedBlob,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
    };
  } catch {
    throw new Error(
      'Cryptographic decryption failed: Invalid PIN or document was tampered with (AES-GCM authentication mismatch).'
    );
  }
}
