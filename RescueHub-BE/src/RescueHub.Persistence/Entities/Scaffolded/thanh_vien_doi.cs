using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class thanh_vien_doi
{
    public Guid id { get; set; }

    public Guid doi_cuu_ho_id { get; set; }

    public Guid? user_id { get; set; }

    public string? member_code { get; set; }

    public string full_name { get; set; } = null!;

    public string? phone { get; set; }

    public string? gender_code { get; set; }

    public DateOnly? birth_date { get; set; }

    public string? member_role_code { get; set; }

    public string availability_status_code { get; set; } = null!;

    public string health_status_code { get; set; } = null!;

    public bool is_team_leader { get; set; }

    public DateTime? joined_at { get; set; }

    public DateTime? left_at { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chung_chi_thanh_vien> chung_chi_thanh_viens { get; set; } = new List<chung_chi_thanh_vien>();

    public virtual doi_cuu_ho doi_cuu_ho { get; set; } = null!;

    public virtual ICollection<ky_nang_thanh_vien> ky_nang_thanh_viens { get; set; } = new List<ky_nang_thanh_vien>();

    public virtual ICollection<lich_su_san_sang_thanh_vien> lich_su_san_sang_thanh_viens { get; set; } = new List<lich_su_san_sang_thanh_vien>();

    public virtual ICollection<phan_cong_thanh_vien> phan_cong_thanh_viens { get; set; } = new List<phan_cong_thanh_vien>();

    public virtual nguoi_dung? user { get; set; }
}
