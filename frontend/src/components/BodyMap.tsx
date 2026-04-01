import { useCallback, useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { bodyFront, bodyBack, type BodyPartData } from "./bodyMapData";
import { maleFrontBorder, maleBackBorder } from "./bodyMapBorder";

interface BodyMapProps {
  activeSlugs: string[];
  height?: number;
  showLabels?: boolean;
  onToggle?: (slug: string) => void;
}

/* ── Legacy slug mapping (old DB slugs → new library slugs) ── */
const LEGACY_SLUG_MAP: Record<string, string | string[]> = {
  shoulders: ["front-deltoids", "rear-deltoids"],
  deltoids: ["front-deltoids", "rear-deltoids"],
  "back-deltoids": "rear-deltoids",
  abs: ["upper-abs", "middle-abs", "lower-abs"],
  forearms: "forearm",
  quads: "quadriceps",
  adductor: "adductors",
  abductors: "adductors",
  traps: "trapezius",
  lats: "upper-back",
  glutes: "gluteal",
  hamstrings: "hamstring",
  shins: "tibialis",
};

function resolveSlug(slug: string): string[] {
  const mapped = LEGACY_SLUG_MAP[slug];
  if (!mapped) return [slug];
  return Array.isArray(mapped) ? mapped : [mapped];
}

const DEFAULT_FILL = "#3f3f3f";
const HIGHLIGHT_FILL = "#ef5350";
const HEAD_FILL = "#bebebe";

export default function BodyMap({ activeSlugs, height = 280, showLabels = true, onToggle }: BodyMapProps) {
  const activeSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of activeSlugs) {
      for (const resolved of resolveSlug(s)) set.add(resolved);
    }
    return set;
  }, [activeSlugs]);

  const handleClick = useCallback(
    (slug: string) => {
      if (!onToggle) return;
      onToggle(slug);
    },
    [onToggle],
  );

  const renderPaths = (parts: BodyPartData[]) =>
    parts.map((part) => {
      const isActive = activeSet.has(part.slug);
      const baseFill = part.slug === "head" || part.slug === "hair" ? HEAD_FILL : DEFAULT_FILL;
      const fill = isActive ? HIGHLIGHT_FILL : baseFill;
      const paths: React.ReactElement[] = [];

      const pushPath = (d: string, key: string) =>
        paths.push(
          <path
            key={key}
            d={d}
            fill={fill}
            style={{ cursor: onToggle ? "pointer" : "default" }}
            onClick={() => handleClick(part.slug)}
          />,
        );

      part.path.common?.forEach((d, i) => pushPath(d, `${part.slug}-c-${i}`));
      part.path.left?.forEach((d, i) => pushPath(d, `${part.slug}-l-${i}`));
      part.path.right?.forEach((d, i) => pushPath(d, `${part.slug}-r-${i}`));

      return paths;
    });

  const scale = height / 400;
  const containerWidth = 200 * scale;

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" justifyContent="center">
      <Box sx={{ textAlign: "center" }}>
        <div style={{ width: containerWidth, height }}>
          <svg width="100%" height="100%" viewBox="0 0 724 1448">
            <path
              d={maleFrontBorder}
              fill="none"
              stroke="#dfdfdf"
              strokeWidth={2}
              strokeLinecap="butt"
              vectorEffect="non-scaling-stroke"
            />
            {renderPaths(bodyFront)}
          </svg>
        </div>
        {showLabels && (
          <Typography variant="caption" color="text.secondary">
            Front
          </Typography>
        )}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <div style={{ width: containerWidth, height }}>
          <svg width="100%" height="100%" viewBox="724 0 724 1448">
            <path
              d={maleBackBorder}
              fill="none"
              stroke="#dfdfdf"
              strokeWidth={2}
              strokeLinecap="butt"
              vectorEffect="non-scaling-stroke"
            />
            {renderPaths(bodyBack)}
          </svg>
        </div>
        {showLabels && (
          <Typography variant="caption" color="text.secondary">
            Back
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
