using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class don_vi_tinh
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? symbol { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; } = new List<chi_tiet_cap_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_dieu_chuyen_kho> chi_tiet_dieu_chuyen_khos { get; set; } = new List<chi_tiet_dieu_chuyen_kho>();

    public virtual ICollection<chi_tiet_hien_truong> chi_tiet_hien_truongs { get; set; } = new List<chi_tiet_hien_truong>();

    public virtual ICollection<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; } = new List<chi_tiet_phat_cuu_tro>();

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual ICollection<chi_tiet_yeu_cau_cuu_tro> chi_tiet_yeu_cau_cuu_tros { get; set; } = new List<chi_tiet_yeu_cau_cuu_tro>();

    public virtual ICollection<mat_hang> mat_hangs { get; set; } = new List<mat_hang>();
}
