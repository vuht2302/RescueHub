using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nguoi_nhan_thong_bao
{
    public Guid id { get; set; }

    public Guid thong_bao_id { get; set; }

    public string? recipient_type_code { get; set; }

    public Guid? nguoi_dung_id { get; set; }

    public string? phone { get; set; }

    public string? email { get; set; }

    public string? device_token { get; set; }

    public string delivery_status_code { get; set; } = null!;

    public DateTime? delivered_at { get; set; }

    public DateTime? read_at { get; set; }

    public DateTime created_at { get; set; }

    public virtual nguoi_dung? nguoi_dung { get; set; }

    public virtual thong_bao thong_bao { get; set; } = null!;
}
