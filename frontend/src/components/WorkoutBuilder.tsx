import { useReducer } from "react";
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
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import AddIcon from "@mui/icons-material/Add";

interface Exercise {
  id: string;
  exercise: number;
  exercise_title: string;
  parameterType: "sets_reps" | "time" | "open"; // sets/reps OR time OR open
  sets: number | null;
  reps: number | null;
  work_seconds: number | null;
  rest_type: "rest_seconds" | "skip_rests"; // rest seconds OR skip
  rest_seconds: number | null;
  weight_type: "weight" | "bodyweight"; // weight in kg OR bodyweight
  weight: number | null;
  notes: string;
}

interface WorkoutSection {
  id: string;
  type: "warmup" | "training" | "cooldown" | "rest";
  time_seconds: number | null; // For warmup, cooldown, rest sections
  exercises: Exercise[]; // Only for training section
}

interface WorkoutBuilderState {
  title: string;
  description: string;
  difficulty_level: "beginner" | "intermediate" | "advanced" | "expert";
  estimated_duration_minutes: number | null;
  sections: WorkoutSection[];
}

type WorkoutBuilderAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_DIFFICULTY"; payload: string }
  | { type: "SET_DURATION"; payload: number | null }
  | { type: "ADD_SECTION"; payload: WorkoutSection }
  | { type: "REMOVE_SECTION"; payload: string }
  | { type: "UPDATE_SECTION_TIME"; payload: { sectionId: string; time: number | null } }
  | { type: "ADD_EXERCISE"; payload: { sectionId: string; exercise: Exercise } }
  | { type: "REMOVE_EXERCISE"; payload: { sectionId: string; exerciseId: string } }
  | { type: "UPDATE_EXERCISE"; payload: { sectionId: string; exerciseId: string; updates: Partial<Exercise> } }
  | { type: "REORDER_EXERCISES"; payload: { sectionId: string; exercises: Exercise[] } }
  | { type: "SET_STATE"; payload: WorkoutBuilderState };

const initialState: WorkoutBuilderState = {
  title: "",
  description: "",
  difficulty_level: "beginner",
  estimated_duration_minutes: null,
  sections: [],
};

function workoutReducer(state: WorkoutBuilderState, action: WorkoutBuilderAction): WorkoutBuilderState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_DIFFICULTY":
      return { ...state, difficulty_level: action.payload as any };
    case "SET_DURATION":
      return { ...state, estimated_duration_minutes: action.payload };
    case "ADD_SECTION":
      return { ...state, sections: [...state.sections, action.payload] };
    case "REMOVE_SECTION":
      return { ...state, sections: state.sections.filter(s => s.id !== action.payload) };
    case "UPDATE_SECTION_TIME":
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.payload.sectionId ? { ...s, time_seconds: action.payload.time } : s
        ),
      };
    case "ADD_EXERCISE":
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.payload.sectionId
            ? { ...s, exercises: [...(s.exercises || []), action.payload.exercise] }
            : s
        ),
      };
    case "REMOVE_EXERCISE":
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.payload.sectionId
            ? { ...s, exercises: s.exercises?.filter(e => e.id !== action.payload.exerciseId) || [] }
            : s
        ),
      };
    case "UPDATE_EXERCISE":
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.payload.sectionId
            ? {
                ...s,
                exercises: s.exercises?.map(e =>
                  e.id === action.payload.exerciseId ? { ...e, ...action.payload.updates } : e
                ) || [],
              }
            : s
        ),
      };
    case "SET_STATE":
      return action.payload;
    default:
      return state;
  }
}

interface DraggableExerciseItemProps {
  exercise: Exercise;
  exercises: Exercise[];
  onUpdate: (updates: Partial<Exercise>) => void;
  onDelete: () => void;
}

function DraggableExerciseItem({ exercise, exercises, onUpdate, onDelete }: DraggableExerciseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

        {/* Exercise Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={1.5}>
            {/* Exercise Selection */}
            <TextField
              select
              label="Exercise"
              size="small"
              value={exercise.exercise}
              onChange={(e) => onUpdate({ exercise: parseInt(e.target.value) })}
              fullWidth
            >
              <MenuItem value={0} disabled>
                Select exercise
              </MenuItem>
              {exercises?.map((ex: any) => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.title}
                </MenuItem>
              ))}
            </TextField>

            {/* Parameters Grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {/* Parameter Type Selector */}
              <TextField
                select
                label="Parameter"
                size="small"
                value={exercise.parameterType}
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
                value={exercise.weight_type}
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
              {exercise.parameterType === "sets_reps" ? (
                <>
                  <TextField
                    label="Sets"
                    type="number"
                    size="small"
                    value={exercise.sets || ""}
                    onChange={(e) => onUpdate({ sets: e.target.value ? parseInt(e.target.value) : null })}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="Reps"
                    type="number"
                    size="small"
                    value={exercise.reps || ""}
                    onChange={(e) => onUpdate({ reps: e.target.value ? parseInt(e.target.value) : null })}
                    inputProps={{ min: 1 }}
                  />
                </>
              ) : exercise.parameterType === "time" ? (
                <TextField
                  label="Time (seconds)"
                  type="number"
                  size="small"
                  value={exercise.work_seconds || ""}
                  onChange={(e) =>
                    onUpdate({ work_seconds: e.target.value ? parseInt(e.target.value) : null })
                  }
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              ) : null}

              {exercise.weight_type === "weight" ? (
                <TextField
                  label="Weight (kg)"
                  type="number"
                  size="small"
                  value={exercise.weight || ""}
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
              value={exercise.rest_type}
              onChange={(e) => onUpdate({ rest_type: e.target.value as "rest_seconds" | "skip_rests" })}
            >
              <MenuItem value="rest_seconds">Rest (seconds)</MenuItem>
              <MenuItem value="skip_rests">Skip Rest</MenuItem>
            </TextField>

            {exercise.rest_type === "rest_seconds" && (
              <TextField
                label="Rest Duration (seconds)"
                type="number"
                size="small"
                value={exercise.rest_seconds || ""}
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
              value={exercise.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Add notes..."
            />
          </Stack>
        </Box>

        {/* Delete Button */}
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={onDelete} sx={{ mt: 0.5 }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
}

interface WorkoutBuilderProps {
  initialState?: WorkoutBuilderState;
  exercises: any[];
  onSave: (data: WorkoutBuilderState) => void;
}

export default function WorkoutBuilder({ initialState: initialData, exercises, onSave }: WorkoutBuilderProps) {
  const [state, dispatch] = useReducer(workoutReducer, initialData || initialState);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddSection = (type: "warmup" | "training" | "cooldown" | "rest") => {
    const newSection: WorkoutSection = {
      id: `${type}-${Date.now()}`,
      type,
      time_seconds: type === "training" ? null : 300,
      exercises: type === "training" ? [] : [],
    };
    dispatch({ type: "ADD_SECTION", payload: newSection });
  };

  const handleAddExercise = (sectionId: string) => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
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
    dispatch({ type: "ADD_EXERCISE", payload: { sectionId, exercise: newExercise } });
  };

  const handleDragEnd = (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const section = state.sections.find(s => s.id === sectionId);
    if (!section?.exercises) return;

    const activeIndex = section.exercises.findIndex(e => e.id === active.id);
    const overIndex = section.exercises.findIndex(e => e.id === over?.id);

    const reordered = [...section.exercises];
    reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, section.exercises[activeIndex]);

    dispatch({ type: "REORDER_EXERCISES", payload: { sectionId, exercises: reordered } });
  };

  const sectionConfig = {
    warmup: { label: "🟡 Warm Up", color: "warning" },
    training: { label: "🟢 Training", color: "success" },
    cooldown: { label: "🔵 Cool Down", color: "info" },
    rest: { label: "⚫ Rest", color: "error" },
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
          <TextField
            label="Est. Duration (min)"
            type="number"
            value={state.estimated_duration_minutes || ""}
            onChange={(e) =>
              dispatch({
                type: "SET_DURATION",
                payload: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            inputProps={{ min: 5, step: 5 }}
          />
        </Box>
      </Stack>

      {/* Workout Sections */}
      <Box sx={{ borderTop: "2px solid", borderColor: "divider", pt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Workout Structure
        </Typography>

        <Stack spacing={3}>
          {state.sections.map((section) => (
            <Card key={section.id} variant="outlined" sx={{ bgcolor: "background.paper" }}>
              <CardContent sx={{ pb: 2 }}>
                {/* Section Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={sectionConfig[section.type].label}
                      size="small"
                      variant="filled"
                      color={sectionConfig[section.type].color as any}
                    />
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => dispatch({ type: "REMOVE_SECTION", payload: section.id })}
                  >
                    Remove
                  </Button>
                </Box>

                {/* Time Input for non-Training sections */}
                {section.type !== "training" && (
                  <TextField
                    label="Duration (seconds)"
                    type="number"
                    size="small"
                    value={section.time_seconds || ""}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_SECTION_TIME",
                        payload: { sectionId: section.id, time: e.target.value ? parseInt(e.target.value) : null },
                      })
                    }
                    fullWidth
                    inputProps={{ min: 0 }}
                    sx={{ mb: 2 }}
                  />
                )}

                {/* Exercises for Training section */}
                {section.type === "training" && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, section.id)}
                  >
                    <SortableContext
                      items={section.exercises?.map(e => e.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack spacing={1.5}>
                        {section.exercises?.map((exercise) => (
                          <DraggableExerciseItem
                            key={exercise.id}
                            exercise={exercise}
                            exercises={exercises}
                            onUpdate={(updates) =>
                              dispatch({
                                type: "UPDATE_EXERCISE",
                                payload: {
                                  sectionId: section.id,
                                  exerciseId: exercise.id,
                                  updates,
                                },
                              })
                            }
                            onDelete={() =>
                              dispatch({
                                type: "REMOVE_EXERCISE",
                                payload: { sectionId: section.id, exerciseId: exercise.id },
                              })
                            }
                          />
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Add Exercise Button for Training section */}
                {section.type === "training" && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddExercise(section.id)}
                    fullWidth
                    sx={{ mt: 1.5 }}
                  >
                    + Add Exercise
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Add Section Buttons */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddSection("warmup")}
            disabled={state.sections.some(s => s.type === "warmup")}
          >
            + Warm Up
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddSection("training")}
            disabled={state.sections.some(s => s.type === "training")}
          >
            + Training
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddSection("cooldown")}
            disabled={state.sections.some(s => s.type === "cooldown")}
          >
            + Cool Down
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddSection("rest")}
            disabled={state.sections.some(s => s.type === "rest")}
          >
            + Rest
          </Button>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
        <Button variant="contained" onClick={() => onSave(state)}>
          Save Workout
        </Button>
      </Box>
    </Stack>
  );
}
