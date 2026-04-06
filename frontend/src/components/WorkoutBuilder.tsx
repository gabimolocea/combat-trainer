import { useReducer, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Card,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import AddIcon from "@mui/icons-material/Add";
import ExerciseSelector from "./ExerciseSelector";

interface Exercise {
  id: string;
  type: "exercise";
  exercise: number;
  exercise_title: string;
  parameterType: "sets_reps" | "time" | "open";
  sets: number | null;
  reps: number | null;
  work_seconds: number | null;
  rest_type: "rest_seconds" | "skip_rests";
  rest_seconds: number | null;
  weight_type: "weight" | "bodyweight";
  weight: number | null;
  notes: string;
}

interface SpecialSection {
  id: string;
  type: "warmup" | "cooldown" | "rest";
  parameterType: "open" | "time";
  duration_seconds: number | null;
}

type WorkoutItem = Exercise | SpecialSection;

interface WorkoutBuilderState {
  title: string;
  description: string;
  difficulty_level: "beginner" | "intermediate" | "advanced" | "expert";
  items: WorkoutItem[];
}

type WorkoutBuilderAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_DIFFICULTY"; payload: string }
  | { type: "ADD_ITEM"; payload: WorkoutItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_ITEM"; payload: { itemId: string; updates: Partial<WorkoutItem> } }
  | { type: "CONVERT_ITEM_TYPE"; payload: { itemId: string; newType: "exercise" | "warmup" | "cooldown" | "rest" } }
  | { type: "REORDER_ITEMS"; payload: WorkoutItem[] }
  | { type: "SET_STATE"; payload: WorkoutBuilderState };

const initialState: WorkoutBuilderState = {
  title: "",
  description: "",
  difficulty_level: "beginner",
  items: [],
};

function workoutReducer(state: WorkoutBuilderState, action: WorkoutBuilderAction): WorkoutBuilderState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_DIFFICULTY":
      return { ...state, difficulty_level: action.payload as any };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(e => e.id !== action.payload) };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map(e =>
          e.id === action.payload.itemId ? { ...e, ...action.payload.updates } as WorkoutItem : e
        ),
      };
    case "CONVERT_ITEM_TYPE": {
      const { itemId, newType } = action.payload;
      const itemIndex = state.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return state;
      
      const oldItem = state.items[itemIndex];
      let newItem: WorkoutItem;
      
      if (newType === "exercise") {
        newItem = {
          id: oldItem.id,
          type: "exercise",
          exercise: 0,
          exercise_title: "",
          parameterType: "sets_reps",
          sets: 3,
          reps: 10,
          work_seconds: null,
          rest_type: "rest_seconds",
          rest_seconds: 60,
          weight_type: "weight",
          weight: 0,
          notes: "",
        };
      } else {
        newItem = {
          id: oldItem.id,
          type: newType,
          parameterType: "time",
          duration_seconds: 300,
        };
      }
      
      return { ...state, items: state.items.map((i, idx) => idx === itemIndex ? newItem : i) };
    }
    case "REORDER_ITEMS":
      return { ...state, items: action.payload };
    case "SET_STATE":
      return action.payload;
    default:
      return state;
  }
}

interface DraggableWorkoutItemProps {
  item: WorkoutItem;
  allExercises: any[];
  onUpdate: (updates: Partial<WorkoutItem>) => void;
  onDelete: () => void;
  onChangeType?: (newType: "exercise" | "warmup" | "cooldown" | "rest") => void;
}

function DraggableWorkoutItem({ item, allExercises, onUpdate, onDelete, onChangeType }: DraggableWorkoutItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [selectorOpen, setSelectorOpen] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExercise = item.type === "exercise";
  const isSpecial = item.type === "warmup" || item.type === "cooldown" || item.type === "rest";

  const handleItemSelect = (selectedItem: any) => {
    // Check if it's a special item (Rest, Cool Down, Warm Up)
    if (selectedItem.type === "rest" || selectedItem.type === "cooldown" || selectedItem.type === "warmup") {
      // Convert to proper type string
      const typeMap: { [key: string]: "exercise" | "warmup" | "cooldown" | "rest" } = {
        "rest": "rest",
        "cooldown": "cooldown",
        "warmup": "warmup",
      };
      if (onChangeType) {
        onChangeType(typeMap[selectedItem.type]);
      }
    } else {
      // It's a regular exercise
      onUpdate({
        exercise: selectedItem.id,
        exercise_title: selectedItem.title,
      });
    }
    setSelectorOpen(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        p: 1.5,
        backgroundColor: "background.default",
        border: "1px solid",
        borderColor: "action.disabled",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        {/* Drag Handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
            mt: 0.5,
          }}
        >
          <DragHandleIcon sx={{ fontSize: "1.2rem", color: "text.secondary" }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={1.5}>
            {/* Item Selector Button - Works for both exercises and special items */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectorOpen(true)}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
              fullWidth
            >
              {isExercise
                ? (item as Exercise).exercise_title || "Select Item"
                : item.type === "rest"
                ? "Rest"
                : item.type === "cooldown"
                ? "Cool Down"
                : "Warm Up"}
            </Button>

            {/* Regular Exercise Section */}
            {isExercise && (
              <>
                {/* Parameters Grid */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {/* Parameter Type Selector */}
                  <TextField
                    select
                    label="Parameter"
                    size="small"
                    value={(item as Exercise).parameterType}
                    onChange={(e) =>
                      onUpdate({ parameterType: e.target.value as "sets_reps" | "time" | "open" })
                    }
                  >
                    <MenuItem value="sets_reps">Sets & Reps</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                  </TextField>

                  {/* Weight Type Selector */}
                  <TextField
                    select
                    label="Weight"
                    size="small"
                    value={(item as Exercise).weight_type}
                    onChange={(e) =>
                      onUpdate({ weight_type: e.target.value as "weight" | "bodyweight" })
                    }
                  >
                    <MenuItem value="weight">kg</MenuItem>
                    <MenuItem value="bodyweight">Bodyweight</MenuItem>
                  </TextField>
                </Box>

                {/* Dynamic Parameters based on Type */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {(item as Exercise).parameterType === "sets_reps" ? (
                    <>
                      <TextField
                        label="Sets"
                        type="number"
                        size="small"
                        value={(item as Exercise).sets || ""}
                        onChange={(e) => onUpdate({ sets: e.target.value ? parseInt(e.target.value) : null })}
                        inputProps={{ min: 1 }}
                      />
                      <TextField
                        label="Reps"
                        type="number"
                        size="small"
                        value={(item as Exercise).reps || ""}
                        onChange={(e) => onUpdate({ reps: e.target.value ? parseInt(e.target.value) : null })}
                        inputProps={{ min: 1 }}
                      />
                    </>
                  ) : (item as Exercise).parameterType === "time" ? (
                    <TextField
                      label="Time (seconds)"
                      type="number"
                      size="small"
                      value={(item as Exercise).work_seconds || ""}
                      onChange={(e) =>
                        onUpdate({ work_seconds: e.target.value ? parseInt(e.target.value) : null })
                      }
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                  ) : null}

                  {(item as Exercise).weight_type === "weight" ? (
                    <TextField
                      label="Weight (kg)"
                      type="number"
                      size="small"
                      value={(item as Exercise).weight || ""}
                      onChange={(e) => onUpdate({ weight: e.target.value ? parseInt(e.target.value) : null })}
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  ) : null}
                </Box>

                {/* Rest Type */}
                <TextField
                  select
                  label="Rest"
                  size="small"
                  value={(item as Exercise).rest_type}
                  onChange={(e) => onUpdate({ rest_type: e.target.value as "rest_seconds" | "skip_rests" })}
                >
                  <MenuItem value="rest_seconds">Rest (seconds)</MenuItem>
                  <MenuItem value="skip_rests">Skip Rest</MenuItem>
                </TextField>

                {(item as Exercise).rest_type === "rest_seconds" && (
                  <TextField
                    label="Rest Duration (seconds)"
                    type="number"
                    size="small"
                    value={(item as Exercise).rest_seconds || ""}
                    onChange={(e) =>
                      onUpdate({ rest_seconds: e.target.value ? parseInt(e.target.value) : null })
                    }
                    inputProps={{ min: 0 }}
                  />
                )}

                {/* Notes */}
                <TextField
                  label="Notes"
                  size="small"
                  value={(item as Exercise).notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Add notes..."
                />
              </>
            )}

            {/* Special Section (Warm Up, Cool Down, Rest) */}
            {isSpecial && (
              <>
                {(item as SpecialSection).parameterType === "time" && (
                  <TextField
                    label="Duration (seconds)"
                    type="number"
                    size="small"
                    value={(item as SpecialSection).duration_seconds || ""}
                    onChange={(e) =>
                      onUpdate({ duration_seconds: e.target.value ? parseInt(e.target.value) : null })
                    }
                    inputProps={{ min: 0 }}
                  />
                )}
              </>
            )}
          </Stack>
        </Box>

        {/* Delete Button */}
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={onDelete} sx={{ mt: 0.5 }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Exercise Selector Modal */}
      <Dialog
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "80vh" } }}
      >
        <DialogTitle>Select Exercise or Special Section</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ExerciseSelector
            exercises={allExercises}
            onSelect={handleItemSelect}
            onClose={() => setSelectorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Calculate total duration in minutes from workout items
function calculateTotalDuration(items: WorkoutItem[]): number {
  let totalSeconds = 0;
  
  items.forEach((item) => {
    if (item.type === "exercise") {
      const ex = item as Exercise;
      // Add work time
      if (ex.parameterType === "sets_reps" && ex.sets && ex.reps) {
        // Estimate ~3 seconds per rep as default
        totalSeconds += (ex.sets * ex.reps * 3) + (ex.rest_seconds || 0);
      } else if (ex.parameterType === "time" && ex.work_seconds) {
        totalSeconds += ex.work_seconds + (ex.rest_seconds || 0);
      }
    } else {
      // Special sections (warm up, cool down, rest)
      const special = item as SpecialSection;
      if (special.parameterType === "time" && special.duration_seconds) {
        totalSeconds += special.duration_seconds;
      }
    }
  });
  
  return Math.round(totalSeconds / 60);
}

interface WorkoutBuilderProps {
  initialState?: WorkoutBuilderState;
  exercises?: any[];
  onStateChange?: (data: WorkoutBuilderState) => void;
}

export default function WorkoutBuilder({ 
  initialState: initialData, 
  exercises = [], 
  onStateChange 
}: WorkoutBuilderProps) {
  const [state, dispatch] = useReducer(workoutReducer, initialData || initialState);

  // Call onStateChange whenever state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      type: "exercise",
      exercise: 0,
      exercise_title: "",
      parameterType: "sets_reps",
      sets: 3,
      reps: 10,
      work_seconds: null,
      rest_type: "rest_seconds",
      rest_seconds: 60,
      weight_type: "weight",
      weight: 0,
      notes: "",
    };
    dispatch({ type: "ADD_ITEM", payload: newExercise });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const activeIndex = state.items.findIndex(e => e.id === active.id);
    const overIndex = state.items.findIndex(e => e.id === over?.id);

    const reordered = [...state.items];
    reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, state.items[activeIndex]);

    dispatch({ type: "REORDER_ITEMS", payload: reordered });
  };

  return (
    <Stack spacing={3}>
      {/* Workout Header */}
      <Stack spacing={2}>
        <TextField
          label="Workout Title"
          value={state.title}
          onChange={(e) => dispatch({ type: "SET_TITLE", payload: e.target.value })}
          fullWidth
          required
          placeholder="Enter workout name..."
        />
        <TextField
          label="Description"
          value={state.description}
          onChange={(e) => dispatch({ type: "SET_DESCRIPTION", payload: e.target.value })}
          fullWidth
          multiline
          rows={2}
          placeholder="Describe your workout..."
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            select
            label="Difficulty"
            value={state.difficulty_level}
            onChange={(e) => dispatch({ type: "SET_DIFFICULTY", payload: e.target.value })}
          >
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </TextField>
        </Box>
      </Stack>
      <Box sx={{ borderTop: "2px solid", borderColor: "divider", pt: 2, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Workout Items
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Total Duration: {calculateTotalDuration(state.items)} min
          </Typography>
        </Box>

        {state.items.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={state.items.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1.5}>
                {state.items.map((item) => (
                  <DraggableWorkoutItem
                    key={item.id}
                    item={item}
                    allExercises={exercises}
                    onUpdate={(updates) =>
                      dispatch({
                        type: "UPDATE_ITEM",
                        payload: {
                          itemId: item.id,
                          updates,
                        },
                      })
                    }
                    onDelete={() =>
                      dispatch({
                        type: "REMOVE_ITEM",
                        payload: item.id,
                      })
                    }
                    onChangeType={(newType) =>
                      dispatch({
                        type: "CONVERT_ITEM_TYPE",
                        payload: {
                          itemId: item.id,
                          newType,
                        },
                      })
                    }
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 3 }}>
            No items added yet
          </Typography>
        )}

        {/* Add Button */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddExercise}
          fullWidth
          sx={{ mt: 2 }}
        >
          Add
        </Button>
      </Box>
    </Stack>
  );
}
