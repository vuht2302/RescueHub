using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chi_tiet_hien_truong
{
    public Guid id { get; set; }

    public Guid tinh_trang_hien_truong_id { get; set; }

    public Guid scene_factor_def_id { get; set; }

    public decimal? value_number { get; set; }

    public string? value_text { get; set; }

    public bool? value_bool { get; set; }

    public string? value_json { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public string? option_code { get; set; }

    public DateTime created_at { get; set; }

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual scene_factor_def scene_factor_def { get; set; } = null!;

    public virtual tinh_trang_hien_truong tinh_trang_hien_truong { get; set; } = null!;
}
