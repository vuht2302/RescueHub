using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mat_hang
{
    public Guid id { get; set; }

    public string item_code { get; set; } = null!;

    public string item_name { get; set; } = null!;

    public Guid? nhom_mat_hang_id { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public Guid? chinh_sach_xuat_kho_id { get; set; }

    public bool requires_lot_tracking { get; set; }

    public bool requires_expiry_tracking { get; set; }

    public int? default_shelf_life_days { get; set; }

    public decimal? min_stock_qty { get; set; }

    public decimal? max_stock_qty { get; set; }

    public string? storage_condition { get; set; }

    public bool is_relief_item { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<canh_bao_kho> canh_bao_khos { get; set; } = new List<canh_bao_kho>();

    public virtual ICollection<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; } = new List<chi_tiet_cap_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_dieu_chuyen_kho> chi_tiet_dieu_chuyen_khos { get; set; } = new List<chi_tiet_dieu_chuyen_kho>();

    public virtual ICollection<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; } = new List<chi_tiet_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual ICollection<chi_tiet_yeu_cau_cuu_tro> chi_tiet_yeu_cau_cuu_tros { get; set; } = new List<chi_tiet_yeu_cau_cuu_tro>();

    public virtual chinh_sach_xuat_kho? chinh_sach_xuat_kho { get; set; }

    public virtual ICollection<dat_cho_ton_kho> dat_cho_ton_khos { get; set; } = new List<dat_cho_ton_kho>();

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual ICollection<lo_hang> lo_hangs { get; set; } = new List<lo_hang>();

    public virtual nhom_mat_hang? nhom_mat_hang { get; set; }

    public virtual ICollection<ton_kho> ton_khos { get; set; } = new List<ton_kho>();
}
