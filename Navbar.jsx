import { ROLES } from '../../utils/constants';
import { initials } from '../../utils/formatters';

export function Navbar({ title, subtitle, user, onToggleSidebar, onSignOut, actions }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="menu-toggle"
        onClick={onToggleSidebar}
        aria-label="Open navigation menu"
      >
        ☰
      </button>
      <div className="topbar-titles">
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="topbar-spacer" />
      {actions}
      <div className="topbar-user">
        <div className="avatar" aria-hidden="true">
          {initials(user?.full_name)}
        </div>
        <div className="hide-sm" style={{ lineHeight: 1.25 }}>
          <div className="small strong nowrap">{user?.full_name}</div>
          <div className="tiny muted nowrap">
            {ROLES[user?.role]?.label || user?.role}
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
