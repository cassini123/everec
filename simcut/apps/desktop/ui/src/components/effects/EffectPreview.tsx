interface Props {
  effectId: string;
}

export function EffectPreview({ effectId }: Props) {
  return (
    <div className="effect-preview shrink-0" data-effect={effectId} aria-hidden>
      <div className="effect-preview-scene">
        <div className="effect-preview-mountain" />
        <div className="effect-preview-sun" />
      </div>
      <div className="effect-preview-layer" />
    </div>
  );
}
