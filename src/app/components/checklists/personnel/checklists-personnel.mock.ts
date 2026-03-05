export type MedicalStatus = 'passed' | 'pending' | 'blocked';
export type PersonnelRole = 'trainee' | 'barista' | 'lead' | 'manager';

export interface EmployeeRow {
  id: string;
  fullName: string;
  coffeeShopName: string;
  role: PersonnelRole;
  employmentDate: Date;
  adaptationEndDate: Date;
  trainingStartDate: Date;
  medicalEndDate: Date;
  dismissalDate: Date | null;
  medicalStatus: MedicalStatus;
}

const names = [
  'Ваганова Елизавета Константиновна',
  'Петров Андрей Сергеевич',
  'Кравченко Ирина Павловна',
  'Сидоренко Марк Алексеевич',
  'Назарова Кристина Игоревна',
  'Журавлев Михаил Андреевич',
  'Горбунова Дарья Романовна',
  'Тимофеев Кирилл Николаевич',
  'Мартынова София Викторовна',
  'Гусев Илья Петрович',
  'Григорьева Анна Дмитриевна',
  'Власов Денис Евгеньевич',
];

const coffeeShops = ['SC Мир.Труд.Май.', 'SC Огонь', 'SC Восточный', 'SC Академ'];
const roles: PersonnelRole[] = ['trainee', 'barista', 'lead', 'manager'];
const statuses: MedicalStatus[] = ['passed', 'pending', 'blocked'];

export function makeMockEmployees(): EmployeeRow[] {
  const rows: EmployeeRow[] = [];

  for (let i = 0; i < 24; i += 1) {
    const role = roles[i % roles.length];
    const status = statuses[i % statuses.length];
    const employmentDate = new Date(2024, (i * 2) % 12, 3 + (i % 20));
    const adaptationEndDate = addDays(employmentDate, 40);
    const trainingStartDate = addDays(employmentDate, 7);
    const medicalEndDate = addDays(employmentDate, 320 + (i % 50));

    rows.push({
      id: `mock-${i + 1}`,
      fullName: names[i % names.length],
      coffeeShopName: coffeeShops[i % coffeeShops.length],
      role,
      employmentDate,
      adaptationEndDate,
      trainingStartDate,
      medicalEndDate,
      dismissalDate: i % 11 === 0 ? addDays(medicalEndDate, 20) : null,
      medicalStatus: status,
    });
  }

  return rows;
}

export function roleLabel(role: PersonnelRole): string {
  if (role === 'trainee') return 'Стажер';
  if (role === 'lead') return 'Управляющий';
  if (role === 'manager') return 'Менеджер';
  return 'Бариста';
}

export function medicalStatusLabel(status: MedicalStatus): string {
  if (status === 'passed') return 'Медосмотр пройден';
  if (status === 'pending') return 'Нужно пройти медосмотр';
  return 'Нельзя допускать до работы';
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
