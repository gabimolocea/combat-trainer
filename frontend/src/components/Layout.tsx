import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, Notification } from "@/types";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import CloseIcon from "@mui/icons-material/Close";

const DRAWER_WIDTH = 260;
const NOTIF_DRAWER_WIDTH = 360;

const navItems = [
  { to: "/", icon: <HomeIcon />, label: "Dashboard" },
  { to: "/exercises", icon: <SearchIcon />, label: "Exercises" },
  { to: "/workouts", icon: <FitnessCenterIcon />, label: "Workouts" },
  { to: "/plans", icon: <MenuBookIcon />, label: "Plans" },
  { to: "/calendar", icon: <CalendarMonthIcon />, label: "Calendar" },
  { to: "/social", icon: <GroupIcon />, label: "Social" },
  { to: "/progress", icon: <TrendingUpIcon />, label: "Progress" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifData, isLoading: notifLoading } = useQuery<PaginatedResponse<Notification>>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications/?ordering=-created_at").then((r) => r.data),
  });

  const notifications = notifData?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markRead = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/notifications/${id}/`, { read_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ px: 3 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          onClick={handleNavClick}
          sx={{ textDecoration: "none", color: "text.primary", letterSpacing: "-0.5px" }}
        >
          Combat Trainer
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={isActive}
              onClick={handleNavClick}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <List sx={{ px: 1 }}>
        {!isMobile && (
          <ListItemButton
            onClick={() => {
              setNotifOpen(true);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        )}
        <ListItemButton
          component={Link}
          to="/profile"
          onClick={handleNavClick}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={user?.username ?? "Profile"} />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          zIndex: (t) => t.zIndex.drawer + 2,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRadius: "0 16px 16px 0",
            backgroundColor: "#fff",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          zIndex: (t) => t.zIndex.drawer + 2,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRadius: "0 16px 16px 0",
            backgroundColor: "transparent",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop notifications drawer — slides out beside the sidebar, no overlay */}
      {!isMobile && (
        <Drawer
          anchor="left"
          variant="persistent"
          open={notifOpen}
          sx={{
            zIndex: (t) => t.zIndex.drawer + 1,
            "& .MuiDrawer-paper": {
              width: NOTIF_DRAWER_WIDTH,
              ml: `${DRAWER_WIDTH + 8}px`,
              my: "16px",
              height: "calc(100% - 32px)",
              boxSizing: "border-box",
              borderRadius: "16px",
              border: "none",
              backgroundColor: "#fff",
            },
          }}
        >
          <Toolbar sx={{ px: 2, justifyContent: "space-between" }}>
            <Typography variant="h6">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Typography>
            <IconButton onClick={() => setNotifOpen(false)} edge="end">
              <CloseIcon />
            </IconButton>
          </Toolbar>
          {unreadCount > 0 && (
            <Box sx={{ px: 2, py: 1 }}>
              <Button
                size="small"
                startIcon={<MarkEmailReadIcon />}
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark All Read
              </Button>
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: "auto", px: 1.5, py: 1 }}>
            {notifLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : notifications.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No notifications.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {notifications.map((n) => (
                  <Card
                    key={n.id}
                    sx={{ bgcolor: n.read_at ? "background.paper" : "action.hover" }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={n.read_at ? 400 : 600}>
                        {n.title}
                      </Typography>
                      {n.body && (
                        <Typography variant="caption" color="text.secondary">
                          {n.body}
                        </Typography>
                      )}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                        {!n.read_at && (
                          <Button
                            size="small"
                            sx={{ minWidth: "auto", fontSize: "0.7rem" }}
                            onClick={() => markRead.mutate(n.id)}
                            disabled={markRead.isPending}
                          >
                            Read
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Drawer>
      )}

      {/* Mobile/Tablet full-screen notifications dialog */}
      {isMobile && (
        <Dialog fullScreen open={notifOpen} onClose={() => setNotifOpen(false)}>
          <Toolbar sx={{ px: 2, justifyContent: "space-between" }}>
            <Typography variant="h6">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Typography>
            <IconButton onClick={() => setNotifOpen(false)} edge="end">
              <CloseIcon />
            </IconButton>
          </Toolbar>
          {unreadCount > 0 && (
            <Box sx={{ px: 2, py: 1 }}>
              <Button
                size="small"
                startIcon={<MarkEmailReadIcon />}
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark All Read
              </Button>
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: "auto", px: 1.5, py: 1 }}>
            {notifLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : notifications.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No notifications.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {notifications.map((n) => (
                  <Card
                    key={n.id}
                    sx={{ bgcolor: n.read_at ? "background.paper" : "action.hover" }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={n.read_at ? 400 : 600}>
                        {n.title}
                      </Typography>
                      {n.body && (
                        <Typography variant="caption" color="text.secondary">
                          {n.body}
                        </Typography>
                      )}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                        {!n.read_at && (
                          <Button
                            size="small"
                            sx={{ minWidth: "auto", fontSize: "0.7rem" }}
                            onClick={() => markRead.mutate(n.id)}
                            disabled={markRead.isPending}
                          >
                            Read
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Dialog>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {/* Mobile-only top bar with hamburger */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            px: 1,
            py: 0.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <IconButton onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flex: 1, letterSpacing: "-0.5px" }}>
            Combat Trainer
          </Typography>
          <IconButton onClick={() => setNotifOpen(true)}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
        <Box component="main" sx={{ flex: 1, p: location.pathname === "/calendar" ? 0 : { xs: 2, sm: 3, md: 4 }, maxWidth: location.pathname === "/calendar" ? "100%" : 960, mx: "auto", width: "100%" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
