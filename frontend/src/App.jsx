import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { Home } from './pages/Home';
import { Cardapio } from './pages/Cardapio';
import { MenuKiosk } from './pages/MenuKiosk';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrderTracking } from './pages/OrderTracking';
import { MyOrders } from './pages/MyOrders';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

import Chatbot from './components/Chatbot';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  const isAdmin =
    user && (user.role === 'ADMIN' || user.role === 'EMPLOYEE');

  return isAdmin ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <Routes>

                {/* DELIVERY */}
                <Route path="/" element={<Home />} />

                {/* MENU DE ESCOLHA */}
                <Route path="/kiosk" element={<MenuKiosk />} />

                {/* RESTAURANTE */}
                <Route path="/cardapio" element={<Cardapio />} />

                {/* AUTENTICAÇÃO */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ROTAS PROTEGIDAS */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/tracking/:id"
                  element={<OrderTracking />}
                />

                <Route
                  path="/my-orders"
                  element={
                    <PrivateRoute>
                      <MyOrders />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />

              </Routes>

              <Chatbot />
            </Router>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;