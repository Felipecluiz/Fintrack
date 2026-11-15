import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { Brand } from '../shared/ui/Brand';
import { ThemeToggle } from '../shared/ui/ThemeToggle';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/transactions', label: 'Transações', end: false },
  { to: '/app/categories', label: 'Categorias', end: false },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand to="/app" />
        <nav className="nav" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          {user && (
            <div className="user-chip" title={user.email}>
              <span className="user-chip__avatar" aria-hidden>
                {user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="user-chip__text">
                <strong>{user.name}</strong>
                <span className="muted">{user.email}</span>
              </span>
            </div>
          )}
          <div className="sidebar__actions">
            <ThemeToggle />
            <button type="button" className="button button--ghost button--small" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
