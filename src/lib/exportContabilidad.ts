import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import { Transaccion, Factura } from "@/hooks/useContabilidad";

// Exportar a CSV
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(";"),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(";")) {
          return `"${value}"`;
        }
        return String(value);
      }).join(";")
    )
  ];

  const csvContent = "\uFEFF" + csvRows.join("\n"); // BOM for Excel
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Exportar transacciones a CSV
export const exportTransaccionesToCSV = (transacciones: Transaccion[]) => {
  const data = transacciones.map(t => ({
    "Fecha": format(new Date(t.fecha), "dd/MM/yyyy"),
    "Tipo": t.tipo === "ingreso" ? "Ingreso" : "Gasto",
    "Concepto": t.concepto,
    "Descripción": t.descripcion || "",
    "Categoría": t.categoria?.nombre || "Sin categoría",
    "Importe": t.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 }),
  }));

  exportToCSV(data, `transacciones_${format(new Date(), "yyyy-MM-dd")}`);
};

// Exportar facturas a CSV
export const exportFacturasToCSV = (facturas: Factura[]) => {
  const data = facturas.map(f => ({
    "Número": f.numero,
    "Tipo": f.tipo === "emitida" ? "Emitida" : "Recibida",
    "Fecha emisión": format(new Date(f.fecha_emision), "dd/MM/yyyy"),
    "Fecha vencimiento": f.fecha_vencimiento ? format(new Date(f.fecha_vencimiento), "dd/MM/yyyy") : "",
    "Tercero": f.tercero_nombre,
    "NIF": f.tercero_nif || "",
    "Concepto": f.concepto,
    "Base imponible": f.importe_base.toLocaleString("es-ES", { minimumFractionDigits: 2 }),
    "IVA %": f.iva_porcentaje,
    "Total": Number(f.importe_total).toLocaleString("es-ES", { minimumFractionDigits: 2 }),
    "Estado": f.estado.charAt(0).toUpperCase() + f.estado.slice(1),
  }));

  exportToCSV(data, `facturas_${format(new Date(), "yyyy-MM-dd")}`);
};

// Exportar libro diario a PDF
export const exportLibroDiarioToPDF = (
  transacciones: Transaccion[],
  year: number,
  month?: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Filtrar transacciones por periodo
  const filtered = transacciones.filter(t => {
    const fecha = new Date(t.fecha);
    if (month !== undefined) {
      return fecha.getFullYear() === year && fecha.getMonth() === month;
    }
    return fecha.getFullYear() === year;
  });

  // Ordenar por fecha
  filtered.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Título
  const titulo = month !== undefined 
    ? `Libro Diario - ${format(new Date(year, month), "MMMM yyyy", { locale: es })}`
    : `Libro Diario - Ejercicio ${year}`;
  
  doc.setFontSize(18);
  doc.text(titulo, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 28, { align: "center" });

  // Tabla
  let y = 40;
  const lineHeight = 7;
  const margins = { left: 15, right: 15 };
  const colWidths = [25, 60, 35, 35, 25];

  // Encabezados
  doc.setFillColor(240, 240, 240);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Fecha", margins.left + 2, y);
  doc.text("Concepto", margins.left + colWidths[0] + 2, y);
  doc.text("Debe", margins.left + colWidths[0] + colWidths[1] + 2, y);
  doc.text("Haber", margins.left + colWidths[0] + colWidths[1] + colWidths[2] + 2, y);
  doc.text("Saldo", margins.left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y);

  y += lineHeight;
  doc.setFont("helvetica", "normal");

  let saldoAcumulado = 0;
  let totalDebe = 0;
  let totalHaber = 0;

  filtered.forEach((t, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const debe = t.tipo === "ingreso" ? Number(t.importe) : 0;
    const haber = t.tipo === "gasto" ? Number(t.importe) : 0;
    saldoAcumulado += debe - haber;
    totalDebe += debe;
    totalHaber += haber;

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
    }

    doc.text(format(new Date(t.fecha), "dd/MM/yyyy"), margins.left + 2, y);
    doc.text(t.concepto.substring(0, 35), margins.left + colWidths[0] + 2, y);
    doc.text(debe ? debe.toLocaleString("es-ES", { minimumFractionDigits: 2 }) : "", margins.left + colWidths[0] + colWidths[1] + 2, y);
    doc.text(haber ? haber.toLocaleString("es-ES", { minimumFractionDigits: 2 }) : "", margins.left + colWidths[0] + colWidths[1] + colWidths[2] + 2, y);
    doc.text(saldoAcumulado.toLocaleString("es-ES", { minimumFractionDigits: 2 }), margins.left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y);

    y += lineHeight;
  });

  // Totales
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(230, 230, 230);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("TOTALES", margins.left + 2, y);
  doc.text(totalDebe.toLocaleString("es-ES", { minimumFractionDigits: 2 }), margins.left + colWidths[0] + colWidths[1] + 2, y);
  doc.text(totalHaber.toLocaleString("es-ES", { minimumFractionDigits: 2 }), margins.left + colWidths[0] + colWidths[1] + colWidths[2] + 2, y);
  doc.text(saldoAcumulado.toLocaleString("es-ES", { minimumFractionDigits: 2 }), margins.left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y);

  // Guardar
  const filename = month !== undefined 
    ? `libro_diario_${year}_${String(month + 1).padStart(2, "0")}.pdf`
    : `libro_diario_${year}.pdf`;
  doc.save(filename);
};

// Exportar informe resumen a PDF
export const exportResumenToPDF = (
  transacciones: Transaccion[],
  facturas: Factura[],
  year: number,
  getBalancePorPeriodo: (year: number, month?: number) => { ingresos: number; gastos: number; balance: number }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(20);
  doc.text(`Informe Financiero ${year}`, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 28, { align: "center" });

  let y = 45;

  // Resumen anual
  const balanceAnual = getBalancePorPeriodo(year);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen del ejercicio", 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Total ingresos: ${balanceAnual.ingresos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, 25, y);
  y += 7;
  doc.text(`Total gastos: ${balanceAnual.gastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, 25, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text(`Resultado neto: ${balanceAnual.balance.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, 25, y);
  y += 15;

  // Desglose mensual
  doc.setFont("helvetica", "bold");
  doc.text("Desglose mensual", 20, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  meses.forEach((mes, index) => {
    const balance = getBalancePorPeriodo(year, index);
    if (balance.ingresos > 0 || balance.gastos > 0) {
      doc.text(
        `${mes}: Ingresos ${balance.ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 })} € | Gastos ${balance.gastos.toLocaleString("es-ES", { minimumFractionDigits: 2 })} € | Resultado ${balance.balance.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
        25,
        y
      );
      y += 6;
    }
  });

  y += 10;

  // Facturas pendientes
  const facturasPendientes = facturas.filter(f => f.estado === "pendiente" || f.estado === "vencida");
  if (facturasPendientes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Facturas pendientes", 20, y);
    y += 10;

    const porCobrar = facturasPendientes.filter(f => f.tipo === "emitida").reduce((s, f) => s + Number(f.importe_total), 0);
    const porPagar = facturasPendientes.filter(f => f.tipo === "recibida").reduce((s, f) => s + Number(f.importe_total), 0);

    doc.setFont("helvetica", "normal");
    doc.text(`Por cobrar (emitidas): ${porCobrar.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, 25, y);
    y += 7;
    doc.text(`Por pagar (recibidas): ${porPagar.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, 25, y);
  }

  // Guardar
  doc.save(`informe_financiero_${year}.pdf`);
};

// Agrupar transacciones por categoría
const groupTransactionsByCategory = (
  transacciones: Transaccion[],
  tipo: "ingreso" | "gasto"
): { categoria: string; total: number; color: string }[] => {
  const grouped = transacciones
    .filter(t => t.tipo === tipo)
    .reduce((acc, t) => {
      const catName = t.categoria?.nombre || "Sin categoría";
      const color = t.categoria?.color || "#94a3b8";
      if (!acc[catName]) {
        acc[catName] = { total: 0, color };
      }
      acc[catName].total += Number(t.importe);
      return acc;
    }, {} as Record<string, { total: number; color: string }>);

  return Object.entries(grouped)
    .map(([categoria, data]) => ({
      categoria,
      total: data.total,
      color: data.color,
    }))
    .sort((a, b) => b.total - a.total);
};

// Exportar Cuenta de Pérdidas y Ganancias (P&L) a PDF
export const exportPyGToPDF = (
  transacciones: Transaccion[],
  year: number,
  month?: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Filtrar transacciones por periodo
  const filtered = transacciones.filter(t => {
    const fecha = new Date(t.fecha);
    if (month !== undefined) {
      return fecha.getFullYear() === year && fecha.getMonth() === month;
    }
    return fecha.getFullYear() === year;
  });

  // Título
  const titulo = month !== undefined 
    ? `Cuenta de Pérdidas y Ganancias - ${format(new Date(year, month), "MMMM yyyy", { locale: es })}`
    : `Cuenta de Pérdidas y Ganancias - Ejercicio ${year}`;
  
  doc.setFontSize(18);
  doc.text(titulo, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 28, { align: "center" });

  let y = 45;
  const margins = { left: 20, right: 20 };
  const lineHeight = 7;

  // INGRESOS
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94); // green-500
  doc.text("INGRESOS", margins.left, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const ingresosPorCategoria = groupTransactionsByCategory(filtered, "ingreso");
  let totalIngresos = 0;

  ingresosPorCategoria.forEach(item => {
    totalIngresos += item.total;
    doc.text(item.categoria, margins.left + 10, y);
    doc.text(
      item.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
      pageWidth - margins.right,
      y,
      { align: "right" }
    );
    y += lineHeight;
  });

  // Subtotal ingresos
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(34, 197, 94, 0.1);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("Total Ingresos", margins.left + 5, y);
  doc.text(
    totalIngresos.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 15;

  // GASTOS
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68); // red-500
  doc.text("GASTOS", margins.left, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const gastosPorCategoria = groupTransactionsByCategory(filtered, "gasto");
  let totalGastos = 0;

  gastosPorCategoria.forEach(item => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    totalGastos += item.total;
    doc.text(item.categoria, margins.left + 10, y);
    doc.text(
      "- " + item.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
      pageWidth - margins.right,
      y,
      { align: "right" }
    );
    y += lineHeight;
  });

  // Subtotal gastos
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(239, 68, 68, 0.1);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("Total Gastos", margins.left + 5, y);
  doc.text(
    "- " + totalGastos.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 15;

  // RESULTADO
  const resultado = totalIngresos - totalGastos;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  if (resultado >= 0) {
    doc.setFillColor(34, 197, 94);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, 10, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.text("RESULTADO NETO", margins.left + 5, y + 1);
  doc.text(
    resultado.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y + 1,
    { align: "right" }
  );

  // Guardar
  const filename = month !== undefined 
    ? `PyG_${year}_${String(month + 1).padStart(2, "0")}.pdf`
    : `PyG_${year}.pdf`;
  doc.save(filename);
};

// Exportar Cash Flow (Flujo de Caja) a PDF
export const exportCashFlowToPDF = (
  transacciones: Transaccion[],
  year: number,
  month?: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Filtrar transacciones por periodo
  const filtered = transacciones.filter(t => {
    const fecha = new Date(t.fecha);
    if (month !== undefined) {
      return fecha.getFullYear() === year && fecha.getMonth() === month;
    }
    return fecha.getFullYear() === year;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Título
  const titulo = month !== undefined 
    ? `Estado de Flujo de Efectivo - ${format(new Date(year, month), "MMMM yyyy", { locale: es })}`
    : `Estado de Flujo de Efectivo - Ejercicio ${year}`;
  
  doc.setFontSize(18);
  doc.text(titulo, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 28, { align: "center" });

  let y = 45;
  const margins = { left: 20, right: 20 };
  const lineHeight = 7;

  // Calcular saldo inicial (todas las transacciones antes del periodo)
  let saldoInicial = 0;
  const startDate = month !== undefined 
    ? new Date(year, month, 1) 
    : new Date(year, 0, 1);
  
  transacciones.forEach(t => {
    const fecha = new Date(t.fecha);
    if (fecha < startDate) {
      if (t.tipo === "ingreso") {
        saldoInicial += Number(t.importe);
      } else {
        saldoInicial -= Number(t.importe);
      }
    }
  });

  // Saldo inicial
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SALDO INICIAL", margins.left, y);
  doc.text(
    saldoInicial.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 12;

  // ENTRADAS DE EFECTIVO
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("ENTRADAS DE EFECTIVO", margins.left, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const ingresosPorCategoria = groupTransactionsByCategory(filtered, "ingreso");
  let totalEntradas = 0;

  ingresosPorCategoria.forEach(item => {
    totalEntradas += item.total;
    doc.text("(+) " + item.categoria, margins.left + 10, y);
    doc.text(
      item.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
      pageWidth - margins.right,
      y,
      { align: "right" }
    );
    y += lineHeight;
  });

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(230, 255, 230);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("Total Entradas", margins.left + 5, y);
  doc.text(
    "+ " + totalEntradas.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 15;

  // SALIDAS DE EFECTIVO
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68);
  doc.text("SALIDAS DE EFECTIVO", margins.left, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const gastosPorCategoria = groupTransactionsByCategory(filtered, "gasto");
  let totalSalidas = 0;

  gastosPorCategoria.forEach(item => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    totalSalidas += item.total;
    doc.text("(-) " + item.categoria, margins.left + 10, y);
    doc.text(
      item.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
      pageWidth - margins.right,
      y,
      { align: "right" }
    );
    y += lineHeight;
  });

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(255, 230, 230);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("Total Salidas", margins.left + 5, y);
  doc.text(
    "- " + totalSalidas.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 15;

  // FLUJO NETO
  const flujoNeto = totalEntradas - totalSalidas;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 240, 240);
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, lineHeight, "F");
  doc.text("FLUJO NETO DEL PERIODO", margins.left + 5, y);
  doc.setTextColor(flujoNeto >= 0 ? 34 : 239, flujoNeto >= 0 ? 197 : 68, flujoNeto >= 0 ? 94 : 68);
  doc.text(
    (flujoNeto >= 0 ? "+ " : "") + flujoNeto.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y,
    { align: "right" }
  );
  y += 15;

  // SALDO FINAL
  const saldoFinal = saldoInicial + flujoNeto;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  if (saldoFinal >= 0) {
    doc.setFillColor(34, 197, 94);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.rect(margins.left, y - 5, pageWidth - margins.left - margins.right, 10, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.text("SALDO FINAL", margins.left + 5, y + 1);
  doc.text(
    saldoFinal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
    pageWidth - margins.right,
    y + 1,
    { align: "right" }
  );

  // Guardar
  const filename = month !== undefined 
    ? `cash_flow_${year}_${String(month + 1).padStart(2, "0")}.pdf`
    : `cash_flow_${year}.pdf`;
  doc.save(filename);
};

// Exportar Informe Mensual Completo (P&L + CF)
export const exportInformeMensualToPDF = (
  transacciones: Transaccion[],
  year: number,
  month: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const monthName = format(new Date(year, month), "MMMM yyyy", { locale: es });
  
  // Filtrar transacciones del mes
  const filtered = transacciones.filter(t => {
    const fecha = new Date(t.fecha);
    return fecha.getFullYear() === year && fecha.getMonth() === month;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // === PORTADA ===
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Informe Contable", pageWidth / 2, 60, { align: "center" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, 75, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, 90, { align: "center" });

  // Resumen rápido
  const ingresos = filtered.filter(t => t.tipo === "ingreso").reduce((s, t) => s + Number(t.importe), 0);
  const gastos = filtered.filter(t => t.tipo === "gasto").reduce((s, t) => s + Number(t.importe), 0);
  const resultado = ingresos - gastos;

  doc.setFontSize(12);
  let y = 120;
  
  doc.text("Resumen del periodo:", pageWidth / 2, y, { align: "center" });
  y += 15;
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text(`Ingresos: ${ingresos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, pageWidth / 2, y, { align: "center" });
  y += 10;
  
  doc.setTextColor(239, 68, 68);
  doc.text(`Gastos: ${gastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, pageWidth / 2, y, { align: "center" });
  y += 10;
  
  doc.setTextColor(resultado >= 0 ? 34 : 239, resultado >= 0 ? 197 : 68, resultado >= 0 ? 94 : 68);
  doc.text(`Resultado: ${resultado.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, pageWidth / 2, y, { align: "center" });

  // === PÁGINA 2: P&L ===
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Cuenta de Pérdidas y Ganancias", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, 28, { align: "center" });

  y = 45;
  const margins = { left: 20, right: 20 };
  const lineHeight = 7;

  // Ingresos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("INGRESOS", margins.left, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const ingresosPorCat = groupTransactionsByCategory(filtered, "ingreso");
  ingresosPorCat.forEach(item => {
    doc.text("  " + item.categoria, margins.left, y);
    doc.text(item.total.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y, { align: "right" });
    y += lineHeight;
  });

  doc.setFont("helvetica", "bold");
  doc.setFillColor(230, 255, 230);
  doc.rect(margins.left, y - 4, pageWidth - margins.left - margins.right, 7, "F");
  doc.text("Total Ingresos", margins.left + 5, y + 1);
  doc.text(ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y + 1, { align: "right" });
  y += 15;

  // Gastos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68);
  doc.text("GASTOS", margins.left, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const gastosPorCat = groupTransactionsByCategory(filtered, "gasto");
  gastosPorCat.forEach(item => {
    doc.text("  " + item.categoria, margins.left, y);
    doc.text("- " + item.total.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y, { align: "right" });
    y += lineHeight;
  });

  doc.setFont("helvetica", "bold");
  doc.setFillColor(255, 230, 230);
  doc.rect(margins.left, y - 4, pageWidth - margins.left - margins.right, 7, "F");
  doc.text("Total Gastos", margins.left + 5, y + 1);
  doc.text("- " + gastos.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y + 1, { align: "right" });
  y += 15;

  // Resultado
  if (resultado >= 0) {
    doc.setFillColor(34, 197, 94);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.rect(margins.left, y - 4, pageWidth - margins.left - margins.right, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("RESULTADO NETO", margins.left + 5, y + 2);
  doc.text(resultado.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y + 2, { align: "right" });

  // === PÁGINA 3: CASH FLOW ===
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Estado de Flujo de Efectivo", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, 28, { align: "center" });

  // Calcular saldo inicial
  let saldoInicial = 0;
  const startDate = new Date(year, month, 1);
  transacciones.forEach(t => {
    const fecha = new Date(t.fecha);
    if (fecha < startDate) {
      saldoInicial += t.tipo === "ingreso" ? Number(t.importe) : -Number(t.importe);
    }
  });

  y = 45;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SALDO INICIAL", margins.left, y);
  doc.text(saldoInicial.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y, { align: "right" });
  y += 12;

  // Entradas
  doc.setFontSize(12);
  doc.setTextColor(34, 197, 94);
  doc.text("ENTRADAS DE EFECTIVO", margins.left, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  ingresosPorCat.forEach(item => {
    doc.text("  (+) " + item.categoria, margins.left, y);
    doc.text(item.total.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y, { align: "right" });
    y += lineHeight;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Total Entradas: + " + ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", margins.left, y);
  y += 12;

  // Salidas
  doc.setFontSize(12);
  doc.setTextColor(239, 68, 68);
  doc.text("SALIDAS DE EFECTIVO", margins.left, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  gastosPorCat.forEach(item => {
    doc.text("  (-) " + item.categoria, margins.left, y);
    doc.text(item.total.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y, { align: "right" });
    y += lineHeight;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Total Salidas: - " + gastos.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", margins.left, y);
  y += 15;

  // Flujo neto
  doc.setFontSize(11);
  doc.setFillColor(240, 240, 240);
  doc.rect(margins.left, y - 4, pageWidth - margins.left - margins.right, 8, "F");
  doc.text("FLUJO NETO DEL PERIODO", margins.left + 5, y + 1);
  doc.setTextColor(resultado >= 0 ? 34 : 239, resultado >= 0 ? 197 : 68, resultado >= 0 ? 94 : 68);
  doc.text((resultado >= 0 ? "+ " : "") + resultado.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y + 1, { align: "right" });
  y += 15;

  // Saldo final
  const saldoFinal = saldoInicial + resultado;
  if (saldoFinal >= 0) {
    doc.setFillColor(34, 197, 94);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.rect(margins.left, y - 4, pageWidth - margins.left - margins.right, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("SALDO FINAL", margins.left + 5, y + 2);
  doc.text(saldoFinal.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €", pageWidth - margins.right, y + 2, { align: "right" });

  // Guardar
  doc.save(`informe_mensual_${year}_${String(month + 1).padStart(2, "0")}.pdf`);
};
