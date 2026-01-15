import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// INTERFACES
// ============================================================================

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'barista' | 'manager' | 'admin';
  coffeeShop: mongoose.Types.ObjectId;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoffeeShop extends Document {
  name: string;
  address: string;
  phone: string;
  manager?: mongoose.Types.ObjectId;
  openTime: string;
  closeTime: string;
  timezone: string;
  maxBaristasPerShift: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShift extends Document {
  user: mongoose.Types.ObjectId;
  coffeeShop: mongoose.Types.ObjectId;
  date: Date;
  type: 'work' | 'sick_leave' | 'vacation';
  startTime?: string;
  endTime?: string;
  hourlyRate: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWish extends Document {
  user: mongoose.Types.ObjectId;
  coffeeShop: mongoose.Types.ObjectId;
  date: Date;
  type: 'available' | 'unavailable';
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPenalty extends Document {
  user: mongoose.Types.ObjectId;
  coffeeShop: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMAS
// ============================================================================

// User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Некорректный формат email'],
    },
    password: {
      type: String,
      required: [true, 'Пароль обязателен'],
      minlength: [6, 'Пароль должен быть не менее 6 символов'],
    },
    fullName: {
      type: String,
      required: [true, 'ФИО обязательно'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['barista', 'manager', 'admin'],
        message: 'Роль должна быть: barista, manager или admin',
      },
      required: [true, 'Роль обязательна'],
    },
    coffeeShop: {
      type: Schema.Types.ObjectId,
      ref: 'CoffeeShop',
      required: [true, 'Кофейня обязательна'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Часовая ставка обязательна'],
      min: [0, 'Часовая ставка не может быть отрицательной'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для User
UserSchema.index({ email: 1 });
UserSchema.index({ coffeeShop: 1, role: 1 });
UserSchema.index({ isActive: 1 });

// Coffee Shop Schema
const CoffeeShopSchema = new Schema<ICoffeeShop>(
  {
    name: {
      type: String,
      required: [true, 'Название кофейни обязательно'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Адрес обязателен'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Телефон обязателен'],
      trim: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    openTime: {
      type: String,
      default: '08:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)'],
    },
    closeTime: {
      type: String,
      default: '22:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)'],
    },
    timezone: {
      type: String,
      default: 'Europe/Moscow',
    },
    maxBaristasPerShift: {
      type: Number,
      required: [true, 'Максимальное количество бариста на смену обязательно'],
      min: [1, 'Минимум 1 бариста на смену'],
      default: 2,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для CoffeeShop
CoffeeShopSchema.index({ isActive: 1 });
CoffeeShopSchema.index({ manager: 1 });

// Shift Schema
const ShiftSchema = new Schema<IShift>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Пользователь обязателен'],
    },
    coffeeShop: {
      type: Schema.Types.ObjectId,
      ref: 'CoffeeShop',
      required: [true, 'Кофейня обязательна'],
    },
    date: {
      type: Date,
      required: [true, 'Дата обязательна'],
    },
    type: {
      type: String,
      enum: {
        values: ['work', 'sick_leave', 'vacation'],
        message: 'Тип должен быть: work, sick_leave или vacation',
      },
      default: 'work',
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)'],
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Часовая ставка обязательна'],
      min: [0, 'Часовая ставка не может быть отрицательной'],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для Shift
ShiftSchema.index({ user: 1, date: 1 });
ShiftSchema.index({ coffeeShop: 1, date: 1 });
ShiftSchema.index({ isPublished: 1 });
ShiftSchema.index({ date: 1 });

// Wish Schema
const WishSchema = new Schema<IWish>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Пользователь обязателен'],
    },
    coffeeShop: {
      type: Schema.Types.ObjectId,
      ref: 'CoffeeShop',
      required: [true, 'Кофейня обязательна'],
    },
    date: {
      type: Date,
      required: [true, 'Дата обязательна'],
    },
    type: {
      type: String,
      enum: {
        values: ['available', 'unavailable'],
        message: 'Тип должен быть: available или unavailable',
      },
      required: [true, 'Тип пожелания обязателен'],
    },
    startTime: {
      type: String,
      required: [true, 'Время начала обязательно'],
      match: [/^\d{2}:\d{2}$/, 'Неверный формат времени (HH:MM)'],
    },
    endTime: {
      type: String,
      required: [true, 'Время окончания обязательно'],
      match: [/^\d{2}:\d{2}$/, 'Неверный формат времени (HH:MM)'],
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для Wish
WishSchema.index({ user: 1, date: 1 });
WishSchema.index({ coffeeShop: 1, date: 1 });
WishSchema.index({ date: 1, type: 1 });

// Penalty Schema
const PenaltySchema = new Schema<IPenalty>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Пользователь обязателен'],
    },
    coffeeShop: {
      type: Schema.Types.ObjectId,
      ref: 'CoffeeShop',
      required: [true, 'Кофейня обязательна'],
    },
    amount: {
      type: Number,
      required: [true, 'Сумма штрафа обязательна'],
      min: [0, 'Сумма штрафа не может быть отрицательной'],
    },
    reason: {
      type: String,
      required: [true, 'Причина штрафа обязательна'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Дата штрафа обязательна'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Создатель штрафа обязателен'],
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для Penalty
PenaltySchema.index({ user: 1, date: 1 });
PenaltySchema.index({ coffeeShop: 1, date: 1 });
PenaltySchema.index({ date: 1 });

// ============================================================================
// MODELS
// ============================================================================

export const User: Model<IUser> = 
  (mongoose.models['User'] as Model<IUser>) || 
  mongoose.model<IUser>('User', UserSchema);

export const CoffeeShop: Model<ICoffeeShop> = 
  (mongoose.models['CoffeeShop'] as Model<ICoffeeShop>) || 
  mongoose.model<ICoffeeShop>('CoffeeShop', CoffeeShopSchema);

export const Shift: Model<IShift> = 
  (mongoose.models['Shift'] as Model<IShift>) || 
  mongoose.model<IShift>('Shift', ShiftSchema);

export const Wish: Model<IWish> = 
  (mongoose.models['Wish'] as Model<IWish>) || 
  mongoose.model<IWish>('Wish', WishSchema);

export const Penalty: Model<IPenalty> = 
  (mongoose.models['Penalty'] as Model<IPenalty>) || 
  mongoose.model<IPenalty>('Penalty', PenaltySchema);