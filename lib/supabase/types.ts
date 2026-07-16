/**
 * Tipo `Database` mínimo y permisivo para el cliente de Supabase.
 *
 * No usamos los tipos generados por la CLI (para no acoplar el repo a un paso de
 * build). Esto le da a `supabase-js` una forma de esquema válida con filas
 * `Record<string, unknown>`: los `insert/update` aceptan objetos y los `select`
 * devuelven filas que mapeamos con casts explícitos en cada capa de datos.
 */
type GenericRow = Record<string, unknown>;

interface GenericTable {
  Row: GenericRow;
  Insert: GenericRow;
  Update: GenericRow;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      products: GenericTable;
      product_costs: GenericTable;
      product_images: GenericTable;
      sales: GenericTable;
      reservations: GenericTable;
      categories: GenericTable;
      profiles: GenericTable;
      factions: GenericTable;
      legions: GenericTable;
      product_reviews: GenericTable;
    };
    Views: { [key: string]: GenericTable };
    Functions: {
      mark_product_sold: { Args: GenericRow; Returns: GenericRow };
      increment_product_clicks: { Args: GenericRow; Returns: undefined };
      is_admin: { Args: GenericRow; Returns: boolean };
      mark_sale_shipped: { Args: GenericRow; Returns: GenericRow };
      confirm_delivery: { Args: GenericRow; Returns: GenericRow };
      submit_product_review: { Args: GenericRow; Returns: GenericRow };
      admin_submit_product_review: { Args: GenericRow; Returns: GenericRow };
    };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: GenericRow };
  };
}
