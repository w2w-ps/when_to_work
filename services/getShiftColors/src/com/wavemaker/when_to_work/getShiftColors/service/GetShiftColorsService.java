package com.wavemaker.when_to_work.getShiftColors.service;


import com.wavemaker.when_to_work.getShiftColors.model.*;
import com.wavemaker.when_to_work.getShiftColors.model.ResponseRootResponseROOTEntryItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetShiftColorsService {

  /**
   * 
   * 
   * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
   */
  @RequestLine("GET /scheduling/shift-colors")
  @Headers({
    "Accept: application/json",  })
  List<ResponseRootResponseROOTEntryItem> invoke();

}
