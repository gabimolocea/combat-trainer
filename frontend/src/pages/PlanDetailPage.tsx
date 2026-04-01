import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { TrainingPlan } from "@/types";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

export default function PlanDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: plan, isLoading } = useQuery<TrainingPlan>({
    queryKey: ["plan", slug],
    queryFn: () => api.get(`/plans/${slug}/`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return <Typography color="error">Plan not found.</Typography>;
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Box>
        <Typography variant="h4">{plan.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          by {plan.created_by.username}
        </Typography>
      </Box>

      {plan.description && (
        <Typography variant="body1" color="text.secondary">
          {plan.description}
        </Typography>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={plan.difficulty_level} />
        <Chip label={`${plan.duration_weeks} weeks`} variant="outlined" />
        <Chip label={plan.visibility} variant="outlined" />
      </Stack>

      <Divider />

      {plan.weeks.length === 0 ? (
        <Typography color="text.secondary">No weeks defined for this plan.</Typography>
      ) : (
        plan.weeks.map((week) => (
          <Card key={week.id}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Week {week.week_number}{week.title ? `: ${week.title}` : ""}
              </Typography>
              {week.notes && (
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {week.notes}
                </Typography>
              )}
              {week.days.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No days scheduled.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {week.days.map((day) => (
                    <Box
                      key={day.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={500}>
                          Day {day.day_number}{day.title ? `: ${day.title}` : ""}
                        </Typography>
                        {day.notes && (
                          <Typography variant="body2" color="text.secondary">
                            {day.notes}
                          </Typography>
                        )}
                      </Box>
                      {day.workout_title ? (
                        <Chip label={day.workout_title} size="small" variant="outlined" />
                      ) : (
                        <Chip label="Rest Day" size="small" />
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
