using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ly_do
{
    public Guid id { get; set; }

    public string reason_group { get; set; } = null!;

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public bool requires_note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khos { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual ICollection<lich_su_chuyen_doi> lich_su_chuyen_dois { get; set; } = new List<lich_su_chuyen_doi>();

    public virtual ICollection<lich_su_san_sang_thanh_vien> lich_su_san_sang_thanh_viens { get; set; } = new List<lich_su_san_sang_thanh_vien>();

    public virtual ICollection<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vus { get; set; } = new List<lich_su_trang_thai_nhiem_vu>();

    public virtual ICollection<lich_su_trang_thai_phuong_tien> lich_su_trang_thai_phuong_tiens { get; set; } = new List<lich_su_trang_thai_phuong_tien>();

    public virtual ICollection<lich_su_trang_thai_su_co> lich_su_trang_thai_su_cos { get; set; } = new List<lich_su_trang_thai_su_co>();

    public virtual ICollection<phan_cong_doi> phan_cong_dois { get; set; } = new List<phan_cong_doi>();

    public virtual ICollection<yeu_cau_huy_nhiem_vu> yeu_cau_huy_nhiem_vus { get; set; } = new List<yeu_cau_huy_nhiem_vu>();
}
