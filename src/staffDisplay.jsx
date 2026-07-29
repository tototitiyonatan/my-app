export function getRoleClass(role) {
  if (role === 'מומחה') return 'name-specialist';
  if (role === 'מתמחה') return 'name-intern';
  return '';
}

export function StaffName({ person, name, role, as: Tag = 'span', ...props }) {
  const displayRole = role || person?.role;
  const displayName = name ?? person?.last_name ?? person?.id ?? '—';
  return (
    <Tag className={getRoleClass(displayRole)} {...props}>
      {displayName}
    </Tag>
  );
}

export function findStaffByLogin(staffList, input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const byId = staffList.find((s) => s.id === trimmed);
  if (byId) return byId;

  const normalized = trimmed.toLowerCase();
  const matches = staffList.filter(
    (s) => s.last_name.trim().toLowerCase() === normalized
  );

  return matches.length === 1 ? matches[0] : null;
}
