using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class tinh_trang_hien_truong
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public string? observation_source_code { get; set; }

    public Guid? observed_by_user_id { get; set; }

    public DateTime observed_at { get; set; }

    public string? summary { get; set; }

    public string? access_condition_code { get; set; }

    public string? hazard_level_code { get; set; }

    public bool is_current { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<chi_tiet_hien_truong> chi_tiet_hien_truongs { get; set; } = new List<chi_tiet_hien_truong>();

    public virtual nguoi_dung? observed_by_user { get; set; }

    public virtual su_co su_co { get; set; } = null!;
}
