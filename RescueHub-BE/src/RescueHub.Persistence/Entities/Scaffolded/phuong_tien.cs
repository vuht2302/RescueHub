using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phuong_tien
{
    public Guid id { get; set; }

    public string vehicle_code { get; set; } = null!;

    public Guid loai_phuong_tien_id { get; set; }

    public string? plate_no { get; set; }

    public string display_name { get; set; } = null!;

    public Guid? home_dia_diem_id { get; set; }

    public string status_code { get; set; } = null!;

    public int? capacity_person { get; set; }

    public decimal? capacity_weight_kg { get; set; }

    public string? fuel_type_code { get; set; }

    public decimal? range_km { get; set; }

    public DateTime? last_maintenance_at { get; set; }

    public DateTime? next_maintenance_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<doi_phuong_tien> doi_phuong_tiens { get; set; } = new List<doi_phuong_tien>();

    public virtual dia_diem? home_dia_diem { get; set; }

    public virtual ICollection<lich_su_trang_thai_phuong_tien> lich_su_trang_thai_phuong_tiens { get; set; } = new List<lich_su_trang_thai_phuong_tien>();

    public virtual loai_phuong_tien loai_phuong_tien { get; set; } = null!;

    public virtual ICollection<phan_cong_phuong_tien> phan_cong_phuong_tiens { get; set; } = new List<phan_cong_phuong_tien>();

    public virtual ICollection<phuong_tien_nang_luc> phuong_tien_nang_lucs { get; set; } = new List<phuong_tien_nang_luc>();
}
