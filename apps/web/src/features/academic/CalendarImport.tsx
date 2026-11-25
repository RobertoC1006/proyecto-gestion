import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/academic";
import { Dialog } from "../../components/Dialog";
import { Button, Field, Notice } from "../../components/ui";
type Preview = {
  valid: boolean;
  imported: number;
  duplicates: number;
  rows: { row: number; title: string; duplicate: boolean; error?: string }[];
};
export default function CalendarImport({ onClose }: { onClose: () => void }) {
  const [csv, setCsv] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null),
    [done, setDone] = useState(false);
  const client = useQueryClient();
  const action = useMutation({
    mutationFn: (confirm: boolean) =>
      api<Preview>(`imports/${confirm ? "confirm" : "preview"}`, {
        method: "POST",
        body: JSON.stringify({ csv, reason }),
      }),
    onSuccess: (data, confirm) => {
      setPreview(data);
      setError("");
      if (confirm) {
        setDone(true);
        void client.invalidateQueries({ queryKey: ["academic"] });
      }
    },
    onError: (e: Error) => setError(e.message),
  });
  const example =
    "title,type,scope,courseCode,sectionCode,startsAt,endsAt\nParcial de demostración,examen,institution,,,2026-12-01T09:00:00-05:00,2026-12-01T11:00:00-05:00\n";
  return (
    <Dialog title="Importar calendario CSV" onClose={onClose}>
      <p>
        Archivo UTF-8, separado por comas, hasta 48 KiB y 500 eventos. Fechas
        con zona horaria; Lima usa -05:00. Usa los códigos de los cursos y
        secciones existentes.
      </p>
      <a
        className="text-link"
        download="calendario-ejemplo.csv"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(example)}`}
      >
        Descargar formato de ejemplo
      </a>
      <Field label="Archivo CSV">
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={action.isPending || done}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setPreview(null);
            setError("");
            setCsv("");
            if (!file) return;
            if (file.size > 48 * 1024) {
              setError("El archivo supera 48 KiB.");
              return;
            }
            try {
              setCsv(await file.text());
            } catch {
              setError("No se pudo leer el archivo. Selecciónalo nuevamente.");
            }
          }}
        />
      </Field>
      <Field label="Motivo de la importación">
        <input
          value={reason}
          maxLength={500}
          disabled={done || action.isPending}
          onChange={(e) => {
            setReason(e.target.value);
            setPreview(null);
          }}
        />
      </Field>
      {error && (
        <Notice tone="amber" role="alert">
          {error}
        </Notice>
      )}
      {preview && (
        <>
          <Notice tone={preview.valid ? "green" : "amber"}>
            {done
              ? `${preview.imported} eventos importados.`
              : preview.valid
                ? "Vista previa válida. Confirma para publicar."
                : "Corrige los errores y vuelve a seleccionar el archivo. No se ha publicado ningún evento."}{" "}
            {preview.duplicates} duplicados se omiten.
          </Notice>
          <div style={{ maxHeight: 280, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Evento</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>{row.title}</td>
                    <td>
                      {row.error ||
                        (row.duplicate ? "Duplicado: se omite" : "Válido")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        {!done && (
          <Button
            disabled={
              !csv ||
              reason.trim().length < 5 ||
              action.isPending ||
              (preview !== null && !preview.valid)
            }
            onClick={() => action.mutate(!!preview?.valid)}
          >
            {action.isPending
              ? "Validando…"
              : preview?.valid
                ? "Confirmar importación"
                : "Ver vista previa"}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
