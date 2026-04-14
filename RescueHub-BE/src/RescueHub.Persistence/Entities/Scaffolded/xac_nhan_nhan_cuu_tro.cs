using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class xac_nhan_nhan_cuu_tro
{
    public Guid id { get; set; }

    public Guid phat_cuu_tro_id { get; set; }

    public string? ack_by_name { get; set; }

    public string? ack_by_phone { get; set; }

    public DateTime? otp_verified_at { get; set; }

    public Guid? signature_tep_tin_id { get; set; }

    public DateTime? citizen_confirmed_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public virtual phat_cuu_tro phat_cuu_tro { get; set; } = null!;

    public virtual tep_tin? signature_tep_tin { get; set; }
}
