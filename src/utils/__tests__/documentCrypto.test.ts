import { describe, it, expect } from 'vitest';
import {
  isDocumentCryptoSupported,
  isDocumentEncrypted,
  encryptDocumentFile,
  decryptDocumentBlob,
  MAGIC_HEADER,
} from '../documentCrypto';

describe('documentCrypto (Zero-Trust AES-GCM-256 Envelope Encryption)', () => {
  const mockPinHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const wrongPinHash = 'd41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000';

  it('detects Web Crypto Subtle support', () => {
    expect(isDocumentCryptoSupported()).toBe(true);
  });

  it('correctly identifies encrypted vs unencrypted buffers', () => {
    const unencrypted = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    expect(isDocumentEncrypted(unencrypted.buffer)).toBe(false);

    const encrypted = new Uint8Array([0x41, 0x47, 0x59, 0x45, 0x4e, 0x43, 0x01, 0x00]);
    expect(isDocumentEncrypted(encrypted.buffer)).toBe(true);
  });

  it('encrypts and successfully decrypts a PDF document round-trip', async () => {
    const originalContent = 'Sample confidential FD advice certificate for Rammohan';
    const originalBlob = new Blob([originalContent], { type: 'application/pdf' });
    const originalFile = new File([originalBlob], 'HDFC_FD_Advice_2026.pdf', {
      type: 'application/pdf',
    });

    // 1. Encrypt
    const encryptedBlob = await encryptDocumentFile(originalFile, mockPinHash);
    expect(encryptedBlob).toBeInstanceOf(Blob);
    expect(encryptedBlob.type).toBe('application/octet-stream');

    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    expect(isDocumentEncrypted(encryptedBuffer)).toBe(true);

    // Verify first 6 bytes match MAGIC_HEADER
    const headerView = new Uint8Array(encryptedBuffer, 0, 6);
    expect(Array.from(headerView)).toEqual(Array.from(MAGIC_HEADER));

    // 2. Decrypt with correct PIN hash
    const decryptedResult = await decryptDocumentBlob(encryptedBlob, mockPinHash);
    expect(decryptedResult.fileName).toBe('HDFC_FD_Advice_2026.pdf');
    expect(decryptedResult.mimeType).toBe('application/pdf');

    const decryptedText = await decryptedResult.blob.text();
    expect(decryptedText).toBe(originalContent);
  });

  it('fails decryption with wrong PIN hash (AES-GCM authentication mismatch)', async () => {
    const originalContent = 'Confidential property deed';
    const originalFile = new File([originalContent], 'Deed.pdf', { type: 'application/pdf' });

    const encryptedBlob = await encryptDocumentFile(originalFile, mockPinHash);

    await expect(
      decryptDocumentBlob(encryptedBlob, wrongPinHash)
    ).rejects.toThrow(/Cryptographic decryption failed: Invalid PIN/);
  });

  it('passes legacy unencrypted files through unharmed (100% backward compatibility)', async () => {
    const legacyContent = 'Legacy unencrypted document from 2024';
    const legacyBlob = new Blob([legacyContent], { type: 'text/plain' });

    const result = await decryptDocumentBlob(legacyBlob, mockPinHash);
    expect(await result.blob.text()).toBe(legacyContent);
    expect(result.mimeType).toBe('text/plain');
  });

  it('encrypts and decrypts binary image data intact', async () => {
    // 100 random bytes simulating image/JPEG
    const randomBytes = new Uint8Array(100);
    for (let i = 0; i < 100; i++) randomBytes[i] = (i * 37) % 256;

    const imageFile = new File([randomBytes], 'gold_hallmark.jpg', { type: 'image/jpeg' });
    const encrypted = await encryptDocumentFile(imageFile, mockPinHash);
    const decrypted = await decryptDocumentBlob(encrypted, mockPinHash);

    const decryptedBuffer = await decrypted.blob.arrayBuffer();
    const decryptedBytes = new Uint8Array(decryptedBuffer);

    expect(decryptedBytes).toEqual(randomBytes);
    expect(decrypted.fileName).toBe('gold_hallmark.jpg');
    expect(decrypted.mimeType).toBe('image/jpeg');
  });
});
