export interface Vessel {
  series: number;
  name: string;
  category: string;
  designer?: string | null;
  owner: string;
  delivery: string;
  status: string;
}

// Example usage (optional to keep in the file)
/*
const actaAuriga: Vessel = {
  series: 1,
  name: "Acta Auriga",
  category: "CSOV",
  designer: "Ulstein SX195",
  owner: "Acta Marine",
  delivery: "2018",
  status: "Active",
};
*/ 