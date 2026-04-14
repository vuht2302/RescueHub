using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class xac_nhan_duoc_cuu
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public string? ack_type_code { get; set; }

    public Guid? ack_by_user_id { get; set; }

    public string? ack_name { get; set; }

    public string? ack_phone { get; set; }

    public string? ack_method_code { get; set; }

    public string? ack_code { get; set; }

    public DateTime ack_at { get; set; }

    public string? note { get; set; }

    public virtual nguoi_dung? ack_by_user { get; set; }

    public virtual su_co su_co { get; set; } = null!;
}
