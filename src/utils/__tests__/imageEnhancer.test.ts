import { describe, it, expect } from 'vitest';
import { applyContrastAndSharpness, enhanceDocumentImage } from '../imageEnhancer';

describe('imageEnhancer', () => {
  it('passes non-image files through unmodified', async () => {
    const pdfFile = new File(['%PDF-1.4 dummy content'], 'statement.pdf', { type: 'application/pdf' });
    const result = await enhanceDocumentImage(pdfFile);

    expect(result.wasEnhanced).toBe(false);
    expect(result.enhancedFile).toBe(pdfFile);
  });

  it('correctly calculates contrast stretch on simulated pixel data', () => {
    // Create mock ImageData with low contrast (values between 100 and 150)
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 100 + (i % 50);     // R
      data[i + 1] = 100 + (i % 50); // G
      data[i + 2] = 100 + (i % 50); // B
      data[i + 3] = 255;            // A
    }

    const mockImageData = {
      data,
      width,
      height,
      colorSpace: 'srgb',
    } as unknown as ImageData;

    const result = applyContrastAndSharpness(mockImageData);
    expect(result.contrastGainPct).toBeGreaterThan(0);

    // Verify contrast was stretched: min pixel value should be lower and max higher
    let minVal = 255;
    let maxVal = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < minVal) minVal = data[i];
      if (data[i] > maxVal) maxVal = data[i];
    }
    expect(minVal).toBeLessThan(100);
    expect(maxVal).toBeGreaterThan(140);
  });

  it('skips contrast stretch on flat/monochromatic images to prevent noise blowout', () => {
    const data = new Uint8ClampedArray(16 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 120;
      data[i + 1] = 120;
      data[i + 2] = 120;
      data[i + 3] = 255;
    }

    const mockImageData = {
      data,
      width: 4,
      height: 4,
      colorSpace: 'srgb',
    } as unknown as ImageData;

    const result = applyContrastAndSharpness(mockImageData);
    expect(result.contrastGainPct).toBe(0);
  });
});
