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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

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

interface ExerciseSelectorProps {
  exercises: any[];
  onSelect: (exercise: ExercisePreview) => void;
  onClose: () => void;
}

export default function ExerciseSelector({
  exercises,
  onSelect,
  onClose,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExercisePreview | null>(
    exercises.length > 0 ? exercises[0] : null
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

  // Filter exercises based on search and body parts
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.short_description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBodyParts =
        selectedBodyParts.length === 0 ||
        selectedBodyParts.some((bp) => ex.body_part_slugs?.includes(bp));

      return matchesSearch && matchesBodyParts;
    });
  }, [exercises, searchQuery, selectedBodyParts]);

  const handleSelectExercise = (exercise: ExercisePreview) => {
    setSelectedExercise(exercise);
  };

  const handleConfirm = () => {
    if (selectedExercise) {
      onSelect(selectedExercise);
    }
  };

  const getImageUrl = (exercise: ExercisePreview) => {
    if (exercise.media && exercise.media.length > 0) {
      return exercise.media[0].image;
    }
    return "https://via.placeholder.com/400x500?text=No+Image";
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

      {/* Middle Panel - Exercise List */}
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
          {filteredExercises.map((exercise) => (
            <ListItem key={exercise.id} disablePadding>
              <ListItemButton
                selected={selectedExercise?.id === exercise.id}
                onClick={() => handleSelectExercise(exercise)}
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
                  primary={exercise.title}
                  secondary={exercise.short_description}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {filteredExercises.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="textSecondary">
                No exercises found
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Right Panel - Preview */}
      {selectedExercise && (
        <Paper
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            p: 2,
          }}
        >
          {/* Exercise Image */}
          <CardMedia
            component="img"
            image={getImageUrl(selectedExercise)}
            alt={selectedExercise.title}
            sx={{
              height: 200,
              objectFit: "cover",
              borderRadius: 1,
              mb: 2,
            }}
          />

          {/* Exercise Details */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {selectedExercise.title}
          </Typography>

          {selectedExercise.difficulty_level && (
            <Chip
              label={`Difficulty: ${selectedExercise.difficulty_level}`}
              size="small"
              variant="outlined"
              sx={{ mb: 1, width: "fit-content" }}
            />
          )}

          {selectedExercise.short_description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                Description
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedExercise.short_description}
              </Typography>
            </Box>
          )}

          {selectedExercise.instructions && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                Instructions
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                {selectedExercise.instructions.substring(0, 150)}
                {selectedExercise.instructions.length > 150 ? "..." : ""}
              </Typography>
            </Box>
          )}

          {/* Body Parts */}
          {selectedExercise.body_part_slugs && selectedExercise.body_part_slugs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                Body Parts
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {selectedExercise.body_part_slugs.map((part) => (
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
