import { createRoot } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import '@/lib/kigumi';
import '@/index.css';
import { HeroFrameworkSwap } from '@/components/landing/HeroFrameworkSwap';

/*
 * Stage-pixel regions, from the isometric projection in HeroFrameworkSwap.css
 * (rotateX(58deg) rotateZ(-38deg), sheets 300 x 200, menu 140px above the plate).
 * OVERLAP: the menu sheet covers the framework plate here.
 * PLATE_ONLY: only the framework plate is here, clear of the wireframe and the pins.
 */
const OVERLAP = { x: 246, y: 239, size: 8 };
const PLATE_ONLY = { x: 176, y: 316, size: 8 };

async function capture(element: HTMLElement): Promise<ImageData> {
  const base64 = await page.screenshot({ element, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No 2D canvas context');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}

function meanDifference(
  a: ImageData,
  b: ImageData,
  region: { x: number; y: number; size: number }
) {
  let sum = 0;
  for (let y = region.y; y < region.y + region.size; y++) {
    for (let x = region.x; x < region.x + region.size; x++) {
      const i = (y * a.width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        sum += Math.abs(a.data[i + channel] - b.data[i + channel]);
      }
    }
  }
  return sum / (region.size * region.size * 3);
}

test('the framework plate stays under the menu while it slides in', async () => {
  const host = document.createElement('div');
  host.style.width = '560px';
  document.body.append(host);
  createRoot(host).render(<HeroFrameworkSwap />);

  // The first swap starts 2.8 s after mount. Freeze the 750 ms slide just before its
  // end: still animating, but the plate is already where the regions expect it
  await expect
    .poll(() => host.querySelector('.framework-swap__plate--out'), {
      timeout: 6000,
    })
    .not.toBeNull();
  await new Promise(requestAnimationFrame);
  const animations = document.getAnimations();
  expect(animations.length).toBeGreaterThan(0);
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = 740;
  }

  const stage = host.querySelector<HTMLElement>('.framework-swap');
  const plate = host.querySelector<HTMLElement>('.framework-swap__plate--in');
  if (!stage || !plate) throw new Error('Hero framework swap did not render');
  expect(stage.getBoundingClientRect().width).toBe(560);

  const withPlate = await capture(stage);
  plate.style.visibility = 'hidden';
  const withoutPlate = await capture(stage);

  // The plate is painted at its own depth ...
  expect(meanDifference(withPlate, withoutPlate, PLATE_ONLY)).toBeGreaterThan(
    4
  );
  // ... and never over the menu
  expect(meanDifference(withPlate, withoutPlate, OVERLAP)).toBeLessThan(1);
});
