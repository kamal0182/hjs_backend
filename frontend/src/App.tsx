import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { CamionsPage } from "./pages/CamionsPage";
import { ChargesPage } from "./pages/ChargesPage";
import { ClientsDirectoryPage } from "./pages/ClientsDirectoryPage";
import { ClientsMoneyPage } from "./pages/ClientsMoneyPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GazoilPage } from "./pages/GazoilPage";
import { LoginPage } from "./pages/LoginPage";
import { LookupPage } from "./pages/LookupPage";
import { UsersPage } from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="gazoil" element={<GazoilPage />} />
          <Route path="clients-money" element={<ClientsMoneyPage />} />
          <Route path="my-charges" element={<ChargesPage />} />
          <Route path="gestion/utilisateurs" element={<UsersPage />} />
          <Route path="gestion/clients" element={<ClientsDirectoryPage />} />
          <Route path="gestion/camions" element={<CamionsPage />} />
          <Route path="gestion/categories" element={<LookupPage kind="categories" />} />
          <Route path="gestion/villes" element={<LookupPage kind="villes" />} />
          <Route path="gestion/types-paiement" element={<LookupPage kind="paymentTypes" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
