const HEHO_API_URL = "https://heho.vercel.app/api/v1/database/manage";
const HEHO_API_KEY = process.env.NEXT_PUBLIC_HEHO_API_KEY || "";

export interface HehoResponse<T = any> {
  data?: T;
  error?: {
    message: string;
  };
}

export const heho = {
  from: (tableName: string) => ({
    select: async (query: string = "*"): Promise<HehoResponse> => {
      try {
        const response = await fetch(HEHO_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HEHO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "read",
            tableName,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to fetch data");
        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },

    insert: async (data: any[]): Promise<HehoResponse> => {
      try {
        const response = await fetch(HEHO_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HEHO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            tableName,
            data: data[0],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to insert data");
        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },

    update: (updateData: any) => ({
      eq: async (column: string, value: any): Promise<HehoResponse> => {
        try {
          const response = await fetch(HEHO_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HEHO_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "edit",
              tableName,
              id: value,
              data: updateData,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Failed to update data");
          return { data: result };
        } catch (error: any) {
          return { error: { message: error.message } };
        }
      },
    }),

    delete: () => ({
      eq: async (column: string, value: any): Promise<HehoResponse> => {
        try {
          const response = await fetch(HEHO_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HEHO_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "delete",
              tableName,
              id: value,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Failed to delete data");
          return { data: result };
        } catch (error: any) {
          return { error: { message: error.message } };
        }
      },
    }),
  }),
};
