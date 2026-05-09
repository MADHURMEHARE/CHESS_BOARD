import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import PlayerManager from "../components/PlayerManager";
import MainLayout from "../layout";
import Tournament from "../components/Tournament";
import TournamentViewPage from "../pages/TournamentViewPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<MainLayout/>}
        >

          {/* Dashboard */}
          <Route
            index
            element={<DashboardPage />}
          />

          {/* Players */}
          <Route
            path="players"
            element={<PlayerManager />}
          />

          {/* Tournaments */}
          <Route
            path="tournaments"
            element={<Tournament/>}
          />
             <Route
              path="tournaments/:id"
               element={<TournamentViewPage />}
                />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}