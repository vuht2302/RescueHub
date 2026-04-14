using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lo_hang
{
    public Guid id { get; set; }

    public Guid mat_hang_id { get; set; }

    public string lot_no { get; set; } = null!;

    public DateOnly? mfg_date { get; set; }

    public DateOnly? exp_date { get; set; }

    public string? donor_name { get; set; }

    public string? source_document_no { get; set; }

    public string quality_status_code { get; set; } = null!;

    public DateTime? received_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<canh_bao_kho> canh_bao_khos { get; set; } = new List<canh_bao_kho>();

    public virtual ICollection<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; } = new List<chi_tiet_cap_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_dieu_chuyen_kho> chi_tiet_dieu_chuyen_khos { get; set; } = new List<chi_tiet_dieu_chuyen_kho>();

    public virtual ICollection<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; } = new List<chi_tiet_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual ICollection<dat_cho_ton_kho> dat_cho_ton_khos { get; set; } = new List<dat_cho_ton_kho>();

    public virtual mat_hang mat_hang { get; set; } = null!;

    public virtual ICollection<ton_kho> ton_khos { get; set; } = new List<ton_kho>();
}
