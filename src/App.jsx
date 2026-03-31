import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useUser } from './context/UserContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Diet from './pages/Diet'
import Fitness from './pages/Fitness'
import Social from './pages/Social'
import History from './pages/History'

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
    const { isAuthenticated } = useAuth();
    const { onboardingComplete } = useUser();

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (requireOnboarding && !onboardingComplete) return <Navigate to="/onboarding" />;

    return <Layout>{children}</Layout>;
};

function App() {
    const { isAuthenticated } = useAuth();
    const { onboardingComplete } = useUser();

    return (
        <Router>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/" /> : <Login />
                } />

                <Route path="/onboarding" element={
                    !isAuthenticated ? <Navigate to="/login" /> :
                        onboardingComplete ? <Navigate to="/" /> : <Onboarding />
                } />

                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/diet" element={<ProtectedRoute><Diet /></ProtectedRoute>} />
                <Route path="/fitness" element={<ProtectedRoute><Fitness /></ProtectedRoute>} />
                <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}
export default App
