import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, TrainingPlan } from "@/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

export default function PlansPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<TrainingPlan>>({
    queryKey: ["plans", page, search],
    queryFn: () =>
      api
        .get("/plans/", { params: { page, search: search || undefined } })
        .then((r) => r.data),
  });

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Training Plans</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/plans/new"
        >
          New Plan
        </Button>
      </Stack>

      <TextField
        placeholder="Search plans…"
        fullWidth
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !data?.results?.length ? (
        <Typography color="text.secondary" textAlign="center" py={8}>
          No plans found.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {data.results.map((plan) => (
            <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    component={RouterLink}
                    to={`/plans/${plan.id}`}
                    sx={{ textDecoration: "none", color: "inherit" }}
                  >
                    {plan.title}
                  </Typography>
                  {plan.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {plan.description.slice(0, 120)}
                      {plan.description.length > 120 ? "…" : ""}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <Chip label={plan.difficulty_level} size="small" />
                    <Chip label={`${plan.duration_weeks} weeks`} size="small" variant="outlined" />
                    <Chip label={plan.visibility} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    by {plan.created_by.username}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {data && data.count > 10 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(data.count / 10)}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </Box>
      )}
    </Stack>
  );
}
