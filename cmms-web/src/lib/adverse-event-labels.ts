export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  CEDULA: "Cédula de Ciudadanía",
  TARJETA_IDENTIDAD: "Tarjeta de Identidad",
  REGISTRO_CIVIL: "Registro Civil",
  PASAPORTE: "Pasaporte",
  HISTORIA_CLINICA: "Historia Clínica",
};

export const SEX_LABEL: Record<string, string> = {
  FEMENINO: "Femenino",
  MASCULINO: "Masculino",
  SIN_DATO: "Sin dato",
};

export const AGE_UNIT_LABEL: Record<string, string> = {
  SEMANAS: "Semanas",
  MESES: "Meses",
  ANIOS: "Años",
};

export const TIMING_LABEL: Record<string, string> = {
  ANTES_DEL_USO: "Antes del uso del DM",
  DURANTE_EL_USO: "Durante el uso del DM",
  DESPUES_DEL_USO: "Después del uso del DM",
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  EVENTO_ADVERSO_SERIO: "Evento adverso serio",
  EVENTO_ADVERSO_NO_SERIO: "Evento adverso no serio",
  INCIDENTE_ADVERSO_SERIO: "Incidente adverso serio",
  INCIDENTE_ADVERSO_NO_SERIO: "Incidente adverso no serio",
};

export const OUTCOME_LABEL: Record<string, string> = {
  MURIO: "Murió",
  OTRO: "Otro",
};

export const CAUSE_LABEL: Record<string, string> = {
  USO_ANORMAL: "Uso anormal",
  FALLA_ALARMA: "Falla en la alarma",
  HARDWARE_COMPUTADOR: "Hardware del computador",
  FALSO_NEGATIVO: "Falso negativo",
  FALSO_POSITIVO: "Falso positivo",
  RESULTADO_FALSO_PRUEBA: "Resultado falso de la prueba",
  FALLA_DISPOSITIVO_IMPLANTABLE: "Falla en el dispositivo implantable",
  AMBIENTE_INAPROPIADO: "Ambiente inapropiado",
  INCOMPATIBILIDAD: "Incompatibilidad",
  INSTRUCCIONES_USO_ETIQUETADO: "Instrucciones para uso y etiquetado",
  MANTENIMIENTO: "Mantenimiento",
  MATERIAL: "Material",
  EMPAQUE: "Empaque",
  SOFTWARE: "Software",
  CONDICIONES_ALMACENAMIENTO: "Condiciones de almacenamiento",
  ENTRENAMIENTO: "Entrenamiento",
  TRANSPORTE_ENTREGA: "Transporte y entrega",
  CAPACIDAD_USO: "Capacidad de uso",
  ERROR_USO: "Error de uso",
  DESGASTE: "Desgaste",
  NO_RELACIONADO_DISPOSITIVO: "No relacionado con el dispositivo",
  SIN_IDENTIFICAR: "Sin identificar",
  OTROS: "Otros",
};

export const CASE_STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};
