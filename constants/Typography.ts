/**
 * @deprecated Import `DS.typography` from `@/constants/design-system`.
 *
 * Compatibility alias. The sizes here disagreed with the design system
 * (`heading1` was 22 against 24, `body` 14 against 16); they now resolve to the
 * design system's scale.
 */
import type { TextStyle } from 'react-native';

import { DS } from './design-system';

export const Typography = {
  display: DS.typography.display as TextStyle,
  heading1: DS.typography.h1 as TextStyle,
  heading2: DS.typography.h2 as TextStyle,
  heading3: DS.typography.h3 as TextStyle,
  body: DS.typography.body as TextStyle,
  small: DS.typography.caption as TextStyle,
  button: DS.typography.button as TextStyle,
  label: DS.typography.label as TextStyle,
} as const;

export default Typography;
