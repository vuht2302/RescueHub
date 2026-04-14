using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nhiem_vu_cuu_ho
{
    public Guid id { get; set; }

    public string mission_code { get; set; } = null!;

    public Guid su_co_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? coordinator_user_id { get; set; }

    public string? objective { get; set; }

    public Guid? muc_do_uu_tien_id { get; set; }

    public DateTime? planned_start_at { get; set; }

    public DateTime? actual_start_at { get; set; }

    public DateTime? actual_end_at { get; set; }

    public int? eta_minutes { get; set; }

    public string? result_code { get; set; }

    public string? result_summary { get; set; }

    public Guid? closed_by { get; set; }

    public DateTime? closed_at { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<bao_cao_hien_truong> bao_cao_hien_truongs { get; set; } = new List<bao_cao_hien_truong>();

    public virtual nguoi_dung? closed_byNavigation { get; set; }

    public virtual nguoi_dung? coordinator_user { get; set; }

    public virtual ICollection<lich_su_chuyen_doi> lich_su_chuyen_dois { get; set; } = new List<lich_su_chuyen_doi>();

    public virtual ICollection<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vus { get; set; } = new List<lich_su_trang_thai_nhiem_vu>();

    public virtual muc_do_uu_tien? muc_do_uu_tien { get; set; }

    public virtual ICollection<phan_cong_doi> phan_cong_dois { get; set; } = new List<phan_cong_doi>();

    public virtual ICollection<phan_cong_phuong_tien> phan_cong_phuong_tiens { get; set; } = new List<phan_cong_phuong_tien>();

    public virtual su_co su_co { get; set; } = null!;

    public virtual workflow_state? workflow_state { get; set; }

    public virtual ICollection<yeu_cau_chi_vien> yeu_cau_chi_viens { get; set; } = new List<yeu_cau_chi_vien>();

    public virtual ICollection<yeu_cau_huy_nhiem_vu> yeu_cau_huy_nhiem_vus { get; set; } = new List<yeu_cau_huy_nhiem_vu>();
}
