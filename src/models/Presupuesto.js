import mongoose from "mongoose";

const SubcategoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la subcategoría es obligatorio"],
      trim: true,
    },
    valorGastado: {
      type: Number,
      required: [true, "El valor gastado es obligatorio"],
      min: [0, "El valor gastado no puede ser negativo"],
    },
  },
  { timestamps: true }
);

const CategoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la categoría es obligatorio"],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    subcategorias: {
      type: [SubcategoriaSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const PresupuestoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del presupuesto es obligatorio"],
      trim: true,
      default: "Presupuesto personal",
    },
    presupuestoTotal: {
      type: Number,
      required: [true, "El presupuesto total es obligatorio"],
      min: [0, "El presupuesto total no puede ser negativo"],
    },
    categorias: {
      type: [CategoriaSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Presupuesto ||
  mongoose.model("Presupuesto", PresupuestoSchema);