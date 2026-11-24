import Svg, { Circle, Path } from "react-native-svg";

interface CustomIconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

const DEFAULT_COLOR = "#193D31";

/** Basketball glyph from the design exports, drawn on Lucide's 24-unit grid. */
export const BasketballIcon = ({
  color = DEFAULT_COLOR,
  size = 24,
  strokeWidth = 2,
}: CustomIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx={12} cy={12} r={10} />
    <Path d="M12 2v20" />
    <Path d="M2 12h20" />
    <Path d="M5.6 4.4c2.6 2 4.2 4.6 4.2 7.6s-1.6 5.6-4.2 7.6" />
    <Path d="M18.4 4.4c-2.6 2-4.2 4.6-4.2 7.6s1.6 5.6 4.2 7.6" />
  </Svg>
);

/**
 * Soccer ball from the sports design: a centre pentagon (circumradius 4.2) with a seam running
 * from each corner straight out to the rim, all on Lucide's 24-unit grid.
 */
export const SoccerBallIcon = ({
  color = DEFAULT_COLOR,
  size = 24,
  strokeWidth = 2,
}: CustomIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx={12} cy={12} r={10} />
    <Path d="M12 7.8l3.99 2.9-1.52 4.7H9.53l-1.52-4.7Z" />
    <Path d="M12 7.8V2M15.99 10.7l5.52-1.79M14.47 15.4l3.41 4.69M9.53 15.4l-3.41 4.69M8.01 10.7l-5.52-1.79" />
  </Svg>
);

/** Chequered flag for Formula 1: a 3 × 2 grid on its pole, alternate squares filled. */
export const CheckeredFlagIcon = ({
  color = DEFAULT_COLOR,
  size = 24,
  strokeWidth = 2,
}: CustomIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M5 22V3" />
    <Path d="M5 4h15v10H5" />
    <Path d="M5 4h5v5H5ZM15 4h5v5h-5ZM10 9h5v5h-5Z" fill={color} stroke="none" />
  </Svg>
);

/** Smiling comedy mask from the design exports (Characters topic). */
export const MaskIcon = ({
  color = DEFAULT_COLOR,
  size = 24,
  strokeWidth = 2,
}: CustomIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 4.6c5.2-1.6 10.8-1.6 16 0V11c0 5.2-3.6 9.4-8 9.4S4 16.2 4 11Z" />
    <Path d="M7.6 10.2c.8-1 2.2-1 3 0" />
    <Path d="M13.4 10.2c.8-1 2.2-1 3 0" />
    <Path d="M8.6 14.2c1.8 2 5 2 6.8 0" />
  </Svg>
);
