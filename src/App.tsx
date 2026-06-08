import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TaskHallPage from '@/pages/TaskHall';
import TaskMapPage from '@/pages/TaskMap';
import TaskNewPage from '@/pages/TaskNew';
import TaskDetailPage from '@/pages/TaskDetail';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import CommunityJoinPage from '@/pages/CommunityJoin';
import ProfilePage from '@/pages/Profile';
import TransactionsPage from '@/pages/Transactions';
import WithdrawPage from '@/pages/Withdraw';
import LeaderboardPage from '@/pages/Leaderboard';
import MessagesPage from '@/pages/Messages';
import AdminDashboardPage from '@/pages/admin/Dashboard';
import AdminTaskReviewPage from '@/pages/admin/TaskReview';
import AdminComplaintsPage from '@/pages/admin/Complaints';
import AdminConfigPage from '@/pages/admin/Config';

function AppInit({ children }: { children: React.ReactNode }) {
  const loadUserRef = useAuthStore((s) => s.loadUser);
  const isAuthenticatedRef = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticatedRef) {
      loadUserRef();
    }
  }, [isAuthenticatedRef, loadUserRef]);

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AppInit>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/community/join" element={<CommunityJoinPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TaskHallPage />} />
            <Route path="/tasks/map" element={<TaskMapPage />} />
            <Route path="/tasks/new" element={<TaskNewPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/transactions" element={<TransactionsPage />} />
            <Route path="/profile/withdraw" element={<WithdrawPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="community_admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requiredRole="community_admin">
                  <AdminTaskReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute requiredRole="community_admin">
                  <AdminComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute requiredRole="platform_admin">
                  <AdminConfigPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AppInit>
    </Router>
  );
}
