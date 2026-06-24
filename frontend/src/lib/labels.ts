import type { Access, Category, Permission, Role } from '../types';

export const categoryLabels: Record<Category, string> = {
  activity: 'Actividad',
  visit: 'Visita',
  transport: 'Transporte',
  stay: 'Alojamiento',
  food: 'Comida',
  note: 'Nota',
};

export const accessLabels: Record<Access, string> = {
  OWNER: 'Propietario',
  WRITE: 'Edición',
  READ: 'Lectura',
  ADMIN: 'Administrador',
  PUBLIC: 'Público',
};

export const permissionLabels: Record<Permission, string> = {
  READ: 'Lectura',
  WRITE: 'Edición',
};

export const roleLabels: Record<Role, string> = {
  USER: 'Usuario',
  ADMIN: 'Administrador',
};
