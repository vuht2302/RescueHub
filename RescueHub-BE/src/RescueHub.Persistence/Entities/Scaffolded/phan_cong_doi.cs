using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phan_cong_doi
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public Guid doi_cuu_ho_id { get; set; }

    public string? assignment_role_code { get; set; }

    public string response_status_code { get; set; } = null!;

    public DateTime assigned_at { get; set; }

    public DateTime? responded_at { get; set; }

    public Guid? rejection_ly_do_id { get; set; }

    public string? rejection_note { get; set; }

    public bool is_primary_team { get; set; }

    public virtual doi_cuu_ho doi_cuu_ho { get; set; } = null!;

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual ICollection<phan_cong_thanh_vien> phan_cong_thanh_viens { get; set; } = new List<phan_cong_thanh_vien>();

    public virtual ly_do? rejection_ly_do { get; set; }
}
