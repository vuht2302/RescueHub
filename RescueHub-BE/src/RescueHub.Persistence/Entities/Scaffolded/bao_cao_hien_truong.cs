using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class bao_cao_hien_truong
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public Guid? reported_by { get; set; }

    public DateTime reported_at { get; set; }

    public string report_type_code { get; set; } = null!;

    public string? summary { get; set; }

    public int? victim_rescued_count { get; set; }

    public int? victim_unreachable_count { get; set; }

    public int? casualty_count { get; set; }

    public string? next_action_note { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<bao_cao_hien_truong_tep_tin> bao_cao_hien_truong_tep_tins { get; set; } = new List<bao_cao_hien_truong_tep_tin>();

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual nguoi_dung? reported_byNavigation { get; set; }
}
