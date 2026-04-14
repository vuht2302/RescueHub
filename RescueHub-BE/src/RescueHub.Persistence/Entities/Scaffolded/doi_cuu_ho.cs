using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class doi_cuu_ho
{
    public Guid id { get; set; }

    public string team_code { get; set; } = null!;

    public string team_name { get; set; } = null!;

    public string? team_type_code { get; set; }

    public Guid? leader_user_id { get; set; }

    public Guid? home_dia_diem_id { get; set; }

    public Guid? responsible_vung_id { get; set; }

    public string status_code { get; set; } = null!;

    public int max_parallel_mission { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<doi_phuong_tien> doi_phuong_tiens { get; set; } = new List<doi_phuong_tien>();

    public virtual dia_diem? home_dia_diem { get; set; }

    public virtual nguoi_dung? leader_user { get; set; }

    public virtual ICollection<lich_su_chuyen_doi> lich_su_chuyen_doifrom_doi_cuu_hos { get; set; } = new List<lich_su_chuyen_doi>();

    public virtual ICollection<lich_su_chuyen_doi> lich_su_chuyen_doito_doi_cuu_hos { get; set; } = new List<lich_su_chuyen_doi>();

    public virtual ICollection<phan_cong_doi> phan_cong_dois { get; set; } = new List<phan_cong_doi>();

    public virtual vung_phu_trach? responsible_vung { get; set; }

    public virtual ICollection<thanh_vien_doi> thanh_vien_dois { get; set; } = new List<thanh_vien_doi>();
}
