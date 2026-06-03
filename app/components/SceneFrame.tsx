import type { Scene } from '@curio/shared';
import { Platform, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

const CUE: Record<string, string> = {
  '#A8DBC6': '🌍',
  '#F6A6B2': '🧲',
  '#F2C14E': '☀️',
  '#6E4FE8': '🌌',
};

interface SceneFrameProps {
  scene: Scene;
  sceneIndex: number;
  sceneCount: number;
}

export function SceneFrame({ scene, sceneIndex, sceneCount }: SceneFrameProps) {
  const accent = scene.accentColor ?? theme.color.teal;
  const cue = CUE[accent] ?? '✨';

  return (
    <View>
      <View style={[styles.panel, { backgroundColor: accent }]}>
        <Text variant="display">{cue}</Text>
      </View>
      <Text variant="meta" color="inkSoft" style={styles.tag}>
        Scene {sceneIndex + 1} / {sceneCount}
      </Text>
      <Text variant="title" color="ink">
        {scene.caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 230,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select(theme.shadow.clay),
  },
  tag: { marginTop: theme.space.md, marginBottom: theme.space.xs },
});
