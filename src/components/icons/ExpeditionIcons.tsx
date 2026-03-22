import React from 'react';
import Svg, { Path } from 'react-native-svg';

/** Path `d` values match `assets/icons/*.svg` (viewBox 0 0 256 256). */
const PATHS = {
  arrowLeft:
    'M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z',
  arrowRight:
    'M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z',
  download:
    'M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z',
  trash:
    'M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z',
  check:
    'M216,72.23,104,184.23l-56-56a8,8,0,0,0-11.32,11.32l61.66,61.66a8,8,0,0,0,11.32,0L227.32,86.34a8,8,0,0,0-11.32-11.32Z',
} as const;

type Props = { color: string; size?: number };

function Icon({ name, color, size = 22 }: Props & { name: keyof typeof PATHS }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessibilityRole="image">
      <Path d={PATHS[name]} fill={color} />
    </Svg>
  );
}

export function ArrowLeftIcon(props: Props) {
  return <Icon name="arrowLeft" {...props} />;
}

export function ArrowRightIcon(props: Props) {
  return <Icon name="arrowRight" {...props} />;
}

export function DownloadIcon(props: Props) {
  return <Icon name="download" {...props} />;
}

export function TrashIcon(props: Props) {
  return <Icon name="trash" {...props} />;
}

export function CheckIcon(props: Props) {
  return <Icon name="check" {...props} />;
}
