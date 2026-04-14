using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class kho
{
    public Guid id { get; set; }

    public string warehouse_code { get; set; } = null!;

    public string warehouse_name { get; set; } = null!;

    public Guid? loai_kho_id { get; set; }

    public Guid? manager_user_id { get; set; }

    public Guid? dia_diem_id { get; set; }

    public string status_code { get; set; } = null!;

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<canh_bao_kho> canh_bao_khos { get; set; } = new List<canh_bao_kho>();

    public virtual ICollection<dat_cho_ton_kho> dat_cho_ton_khos { get; set; } = new List<dat_cho_ton_kho>();

    public virtual dia_diem? dia_diem { get; set; }

    public virtual ICollection<khu_kho> khu_khos { get; set; } = new List<khu_kho>();

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khofrom_khos { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khoto_khos { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual loai_kho? loai_kho { get; set; }

    public virtual nguoi_dung? manager_user { get; set; }

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_tros { get; set; } = new List<phieu_cap_phat_cuu_tro>();

    public virtual ICollection<phieu_kho> phieu_khodest_khos { get; set; } = new List<phieu_kho>();

    public virtual ICollection<phieu_kho> phieu_khosource_khos { get; set; } = new List<phieu_kho>();

    public virtual ICollection<ton_kho> ton_khos { get; set; } = new List<ton_kho>();
}
