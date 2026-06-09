import type { Scene } from '@curio/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SceneFrame } from './SceneFrame';

afterEach(cleanup);

const scene: Scene = {
  id: 'scene-1',
  imageUrl: 'https://example.test/scene-1.png',
  caption: 'Charged particles hit the atmosphere.',
  accentColor: '#6E4FE8',
};

describe('SceneFrame accessibility', () => {
  it('gives the caption a scene-context label so a screen reader announces the change', () => {
    render(<SceneFrame scene={scene} sceneIndex={1} sceneCount={3} />);
    expect(
      screen.getByLabelText('Scene 2 of 3. Charged particles hit the atmosphere.'),
    ).toBeTruthy();
  });
});
