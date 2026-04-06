import { useState, useMemo } from "react";
import {
  Box,
  TextField,
  CardMedia,
  Typography,
  Stack,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  InputAdornment,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

interface ExercisePreview {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  instructions: string;
  difficulty_level: string;
  body_part_slugs: string[];
  primary_style_name: string;
  media: Array<{
    id: number;
    image: string;
    video: string;
    order: number;
  }>;
}

interface SpecialItem {
  id: string;
  type: "rest" | "cooldown" | "warmup";
  title: string;
}

type SelectableItem = ExercisePreview | SpecialItem;

interface ExerciseSelectorProps {
  exercises: any[];
  onSelect: (item: SelectableItem) => void;
  onClose: () => void;
}

const SPECIAL_ITEMS: SpecialItem[] = [
  { id: "rest", type: "rest", title: "Rest" },
  { id: "cooldown", type: "cooldown", title: "Cool Down" },
  { id: "warmup", type: "warmup", title: "Warm Up" },
];

function isExercise(item: SelectableItem): item is ExercisePreview {
  return "slug" in item && "difficulty_level" in item;
}

function isSpecial(item: SelectableItem): item is SpecialItem {
  return "type" in item && (item.type === "rest" || item.type === "cooldown" || item.type === "warmup");
}

export default function ExerciseSelector({
  exercises,
  onSelect,
  onClose,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(
    SPECIAL_ITEMS[0]
  );
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);

  // Extract unique body parts for filtering
  const allBodyParts = useMemo(() => {
    const parts = new Set<string>();
    exercises.forEach((ex) => {
      ex.body_part_slugs?.forEach((part: string) => parts.add(part));
    });
    return Array.from(parts).sort();
  }, [exercises]);

  // Filter and combine special items and exercises
  const filteredItems = useMemo(() => {
    const allItems: SelectableItem[] = [...SPECIAL_ITEMS, ...exercises];
    
    return allItems.filter((item) => {
      if (isSpecial(item)) {
        return item.title.toLowerCase().includes(searchQuery.toLowerCase());
      }

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.short_description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBodyParts =
        selectedBodyParts.length === 0 ||
        selectedBodyParts.some((bp) => item.body_part_slugs?.includes(bp));

      return matchesSearch && matchesBodyParts;
    });
  }, [exercises, searchQuery, selectedBodyParts]);

  const handleSelectItem = (item: SelectableItem) => {
    setSelectedItem(item);
  };

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  const getImageUrl = (item: SelectableItem): string | null => {
    if (isSpecial(item)) return null;
    if (item.media && item.media.length > 0) return item.media[0].image;
    return null;
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1.5fr",
        gap: 2,
        height: "600px",
        p: 2,
      }}
    >
      {/* Left Panel - Filters */}
      <Paper sx={{ p: 2, overflow: "auto" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Body Parts
        </Typography>
        <Stack spacing={1}>
          {allBodyParts.map((bodyPart) => (
            <Chip
              key={bodyPart}
              label={bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)}
              variant={selectedBodyParts.includes(bodyPart) ? "filled" : "outlined"}
              onClick={() => {
                setSelectedBodyParts((prev) =>
                  prev.includes(bodyPart)
                    ? prev.filter((bp) => bp !== bodyPart)
                    : [...prev, bodyPart]
                );
              }}
              size="small"
            />
          ))}
        </Stack>
      </Paper>

      {/* Middle Panel - Items List */}
      <Paper sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <List sx={{ flex: 1, overflow: "auto" }}>
          {/* Special Items Section */}
          {filteredItems.filter(isSpecial).map((item) => (
            <Box key={item.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedItem?.id === item.id}
                  onClick={() => handleSelectItem(item)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor: "action.selected",
                    },
                  }}
                >
                  <ListItemText
                    primary={item.title}
                    secondary="Special Section"
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              </ListItem>
            </Box>
          ))}

          {/* Divider between special items and exercises */}
          {filteredItems.filter(isSpecial).length > 0 &&
            filteredItems.filter(isExercise).length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}

          {/* Exercises Section */}
          {filteredItems.filter(isExercise).map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={selectedItem?.id === item.id}
                onClick={() => handleSelectItem(item)}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  py: 1.5,
                  px: 2,
                  "&.Mui-selected": {
                    backgroundColor: "action.selected",
                  },
                }}
              >
                <ListItemText
                  primary={item.title}
                  secondary={item.short_description}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {filteredItems.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="textSecondary">
                No items found
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Right Panel - Preview */}
      {selectedItem && (
        <Paper
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            p: 2,
          }}
        >
          {/* Item Image */}
          {getImageUrl(selectedItem) ? (
            <CardMedia
              component="img"
              image={getImageUrl(selectedItem)!}
              alt={selectedItem.title}
              sx={{
                height: 200,
                objectFit: "cover",
                borderRadius: 1,
                mb: 2,
              }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                borderRadius: 1,
                mb: 2,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1,
                color: "text.disabled",
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: 48 }} />
              <Typography variant="caption">{isSpecial(selectedItem) ? selectedItem.type : "No image"}</Typography>
            </Box>
          )}

          {/* Item Details */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {selectedItem.title}
          </Typography>

          {isSpecial(selectedItem) && (
            <Typography variant="body2" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
              Special Section - {selectedItem.type === "rest" ? "Rest period" : selectedItem.type === "cooldown" ? "Cool down section" : "Warm up section"}
            </Typography>
          )}

          {isExercise(selectedItem) && selectedItem.difficulty_level && (
            <Chip
              label={`Difficulty: ${selectedItem.difficulty_level}`}
              size="small"
              variant="outlined"
              sx={{ mb: 1, width: "fit-content" }}
            />
          )}

          {isExercise(selectedItem) && selectedItem.short_description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                Description
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedItem.short_description}
              </Typography>
            </Box>
          )}

          {isExercise(selectedItem) && selectedItem.instructions && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                Instructions
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                {selectedItem.instructions.substring(0, 150)}
                {selectedItem.instructions.length > 150 ? "..." : ""}
              </Typography>
            </Box>
          )}

          {/* Body Parts */}
          {isExercise(selectedItem) &&
            selectedItem.body_part_slugs &&
            selectedItem.body_part_slugs.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                  Body Parts
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {selectedItem.body_part_slugs.map((part) => (
                    <Chip
                      key={part}
                      label={part}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleConfirm}
            >
              Select
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={onClose}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
