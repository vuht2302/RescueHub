using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class danh_gia_su_co
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public Guid? assessed_by { get; set; }

    public DateTime assessed_at { get; set; }

    public Guid? muc_do_uu_tien_id { get; set; }

    public Guid? muc_do_nghiem_trong_id { get; set; }

    public string? access_difficulty_code { get; set; }

    public int? victim_count_est { get; set; }

    public int? injured_count_est { get; set; }

    public int? vulnerable_count_est { get; set; }

    public bool requires_medical_support { get; set; }

    public bool requires_evacuation { get; set; }

    public string? notes { get; set; }

    public DateTime created_at { get; set; }

    public virtual nguoi_dung? assessed_byNavigation { get; set; }

    public virtual muc_do_nghiem_trong? muc_do_nghiem_trong { get; set; }

    public virtual muc_do_uu_tien? muc_do_uu_tien { get; set; }

    public virtual su_co su_co { get; set; } = null!;
}
